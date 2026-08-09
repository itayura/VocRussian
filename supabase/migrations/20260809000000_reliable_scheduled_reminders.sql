-- Make server-side reminders tolerant of missed cron minutes and preserve the
-- app's default of enabled reminders when the preference is not yet stored.
UPDATE public.voc_stats
SET settings = jsonb_set(
    COALESCE(settings, '{}'::jsonb),
    '{dailyReminders}',
    'true'::jsonb,
    true
)
WHERE COALESCE(settings->>'dailyReminders', '') = '';

CREATE OR REPLACE FUNCTION public.check_and_send_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, net
AS $$
DECLARE
    r record;
    user_tz text;
    reminder_time text;
    current_time_in_tz text;
    today_in_tz text;
    request_id bigint;
    project_host text;
    reminders_key text;
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

    reminders_key := private.get_reminders_secret_key();
    IF reminders_key IS NULL OR reminders_key = '' THEN
        RAISE EXCEPTION 'reminders_secret_key is not configured in Vault';
    END IF;

    FOR r IN
        SELECT s.user_id, s.last_active_date, COALESCE(s.settings, '{}'::jsonb) AS settings, s.streak
        FROM public.voc_stats s
        -- Missing preference means enabled, matching the client default.
        WHERE COALESCE(s.settings->>'dailyReminders', 'true') = 'true'
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

        -- Run any time after the configured minute, but only once per local day.
        -- This prevents a delayed/missed cron tick from losing the reminder.
        IF current_time_in_tz >= reminder_time
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
                    'apikey', reminders_key
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
