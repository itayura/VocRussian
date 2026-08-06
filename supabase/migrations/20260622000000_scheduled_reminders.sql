-- Server-side daily reminder scheduler.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.app_config (
    key text PRIMARY KEY,
    value text
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'app_config'
          AND policyname = 'Allow public read access to app_config'
    ) THEN
        CREATE POLICY "Allow public read access to app_config"
            ON public.app_config FOR SELECT TO anon, authenticated USING (true);
    END IF;
END $$;

INSERT INTO public.app_config (key, value)
VALUES ('project_host', 'bghuansvungabgsbxqjh.supabase.co')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.get_service_role_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, vault
AS $$
DECLARE
    key_val text;
BEGIN
    SELECT secret INTO key_val
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;
    RETURN key_val;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION private.get_service_role_key() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_and_send_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, net
AS $$
DECLARE
    r record;
    user_tz text;
    reminder_time text;
    current_time_in_tz text;
    today_in_tz text;
    request_id bigint;
    project_host text;
    service_key text;
    selected_msg jsonb;
    messages jsonb[] := ARRAY[
        jsonb_build_object('title', 'Keep your streak active!', 'body', 'A quick Russian review will keep your learning momentum going.'),
        jsonb_build_object('title', 'Your Russian review is ready', 'body', 'Practice your due words and work toward today''s 20 XP goal.'),
        jsonb_build_object('title', 'Time for a quick lesson', 'body', 'A few focused minutes today will strengthen long-term recall.'),
        jsonb_build_object('title', 'Daily goal awaits', 'body', 'Open Privyetik and continue your Russian learning streak.'),
        jsonb_build_object('title', 'Привет! Ready to practice?', 'body', 'Your vocabulary and grammar practice are waiting.')
    ];
BEGIN
    SELECT value INTO project_host FROM public.app_config WHERE key = 'project_host';
    IF project_host IS NULL OR project_host = '' THEN
        RAISE EXCEPTION 'project_host is not configured';
    END IF;

    service_key := private.get_service_role_key();
    IF service_key IS NULL OR service_key = '' THEN
        RAISE EXCEPTION 'service_role_key is not configured in Vault';
    END IF;

    FOR r IN
        SELECT s.user_id, s.last_active_date, s.settings, s.streak
        FROM public.voc_stats s
        WHERE COALESCE(s.settings->>'dailyReminders', 'false') = 'true'
    LOOP
        user_tz := COALESCE(NULLIF(r.settings->>'timezone', ''), 'UTC');
        reminder_time := COALESCE(r.settings->>'reminderTime', '19:00');
        IF reminder_time !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$' THEN
            reminder_time := '19:00';
        END IF;

        BEGIN
            current_time_in_tz := to_char(timezone(user_tz, now()), 'HH24:MI');
            today_in_tz := to_char(timezone(user_tz, now()), 'YYYY-MM-DD');
        EXCEPTION WHEN OTHERS THEN
            user_tz := 'UTC';
            current_time_in_tz := to_char(timezone('UTC', now()), 'HH24:MI');
            today_in_tz := to_char(timezone('UTC', now()), 'YYYY-MM-DD');
        END;

        IF current_time_in_tz = reminder_time
           AND (r.last_active_date IS NULL OR r.last_active_date <> today_in_tz)
           AND NOT EXISTS (
               SELECT 1 FROM public.reminder_logs log
               WHERE log.user_id = r.user_id
                 AND to_char(timezone(user_tz, log.sent_at), 'YYYY-MM-DD') = today_in_tz
           ) THEN
            selected_msg := messages[1 + floor(random() * array_length(messages, 1))::int];

            SELECT net.http_post(
                url := 'https://' || project_host || '/functions/v1/send-push',
                body := jsonb_build_object(
                    'userId', r.user_id,
                    'title', selected_msg->>'title',
                    'body', selected_msg->>'body'
                )::text,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || service_key
                )
            ) INTO request_id;

            INSERT INTO public.reminder_logs (
                user_id, streak, reminder_time, notification_title,
                notification_body, status, request_id
            ) VALUES (
                r.user_id, COALESCE(r.streak, 0), reminder_time,
                selected_msg->>'title', selected_msg->>'body', 'sent', request_id
            );
        END IF;
    END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.check_and_send_reminders() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('daily-reminders-cron')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-reminders-cron');
SELECT cron.schedule(
    'daily-reminders-cron',
    '* * * * *',
    $$ SELECT public.check_and_send_reminders(); $$
);
