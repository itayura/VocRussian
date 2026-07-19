-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create app config table for global variables like project host
CREATE TABLE IF NOT EXISTS public.app_config (
    key text PRIMARY KEY,
    value text
);

-- Insert default production project host. Replace with your actual project ref domain if it changes.
INSERT INTO public.app_config (key, value)
VALUES ('project_host', 'bghuansvungabgsbxqjh.supabase.co')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Helper to retrieve the service_role key safely from Vault
CREATE OR REPLACE FUNCTION public.get_service_role_key()
RETURNS text AS $$
DECLARE
    key_val text;
BEGIN
    BEGIN
        SELECT secret INTO key_val FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        key_val := NULL;
    END;
    RETURN key_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Main routine to scan and trigger daily reminders
CREATE OR REPLACE FUNCTION public.check_and_send_reminders()
RETURNS void AS $$
DECLARE
    r record;
    user_tz text;
    reminder_time text;
    reminder_hour int;
    current_hour_in_tz int;
    today_in_tz text;
    request_id bigint;
    project_host text;
    url_scheme text;
    service_key text;
BEGIN
    -- 1. Try to get project host from app_config table
    SELECT value INTO project_host FROM public.app_config WHERE key = 'project_host';

    -- 2. Fallback to request header if running from an API context
    IF project_host IS NULL OR project_host = '' THEN
        project_host := current_setting('request_header_x_forwarded_host', true);
    END IF;

    -- 3. Fallback to localhost if still empty
    IF project_host IS NULL OR project_host = '' THEN
        project_host := 'localhost:54321';
    END IF;

    -- Determine scheme (http for localhost development, https for production cloud)
    IF project_host LIKE 'localhost%' OR project_host LIKE '127.0.0.1%' THEN
        url_scheme := 'http://';
    ELSE
        url_scheme := 'https://';
    END IF;

    -- Get service role key for authentication from Vault
    -- Note: Make sure to run this SQL in Supabase SQL Editor once to set it up:
    -- SELECT vault.create_secret('YOUR_ACTUAL_SERVICE_ROLE_KEY', 'service_role_key');
    service_key := public.get_service_role_key();

    -- Loop through all users who have dailyReminders enabled
    FOR r IN 
        SELECT s.user_id, s.last_active_date, s.settings, s.streak
        FROM public.voc_stats s
        WHERE (s.settings->>'dailyReminders')::boolean = true
    LOOP
        -- Get timezone or fallback to UTC
        user_tz := COALESCE(r.settings->>'timezone', 'UTC');
        
        -- Get reminderTime (format 'HH:MI', e.g., '19:00')
        reminder_time := COALESCE(r.settings->>'reminderTime', '19:00');
        reminder_hour := split_part(reminder_time, ':', 1)::int;
        
        -- Get current hour in user's timezone
        BEGIN
            current_hour_in_tz := EXTRACT(HOUR FROM timezone(user_tz, now()))::int;
            today_in_tz := to_char(timezone(user_tz, now()), 'YYYY-MM-DD');
        EXCEPTION WHEN OTHERS THEN
            -- Fallback to UTC if timezone is invalid
            current_hour_in_tz := EXTRACT(HOUR FROM timezone('UTC', now()))::int;
            today_in_tz := to_char(timezone('UTC', now()), 'YYYY-MM-DD');
        END;
        
        -- Check if current hour in user's timezone matches the reminder hour
        IF current_hour_in_tz = reminder_hour THEN
            -- Check if they did NOT study yet today in their timezone
            IF r.last_active_date IS NULL OR r.last_active_date != today_in_tz THEN
                -- Trigger HTTP post to send-push edge function
                SELECT net.http_post(
                    url := url_scheme || project_host || '/functions/v1/send-push',
                    body := jsonb_build_object(
                        'userId', r.user_id,
                        'title', 'Keep your streak active! 🇷🇺',
                        'body', 'Keep your ' || COALESCE(r.streak, 0) || '-day streak alive! Take a few minutes to review your Russian vocabulary today.'
                    )::text,
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer ' || COALESCE(service_key, '')
                    )
                ) INTO request_id;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule pg_cron hourly job (at minute 0)
-- Unschedules first if already registered to avoid duplication
SELECT cron.unschedule('daily-reminders-cron') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-reminders-cron');
SELECT cron.schedule(
    'daily-reminders-cron',
    '0 * * * *',
    $$ SELECT public.check_and_send_reminders(); $$
);
