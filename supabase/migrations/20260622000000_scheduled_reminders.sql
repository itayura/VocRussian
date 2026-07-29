-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create app config table for global variables like project host
CREATE TABLE IF NOT EXISTS public.app_config (
    key text PRIMARY KEY,
    value text
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'app_config' AND policyname = 'Allow public read access to app_config'
    ) THEN
        CREATE POLICY "Allow public read access to app_config"
            ON public.app_config FOR SELECT
            TO anon, authenticated
            USING (true);
    END IF;
END $$;

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
    user_streak int;
    msg_pool jsonb[];
    selected_msg jsonb;
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

    service_key := public.get_service_role_key();

    -- Loop through all users who have dailyReminders enabled
    FOR r IN 
        SELECT s.user_id, s.last_active_date, s.settings, s.streak
        FROM public.voc_stats s
        WHERE (s.settings->>'dailyReminders')::boolean = true
    LOOP
        user_tz := COALESCE(r.settings->>'timezone', 'UTC');
        reminder_time := COALESCE(r.settings->>'reminderTime', '19:00');
        reminder_hour := split_part(reminder_time, ':', 1)::int;
        user_streak := COALESCE(r.streak, 0);

        BEGIN
            current_hour_in_tz := EXTRACT(HOUR FROM timezone(user_tz, now()))::int;
            today_in_tz := to_char(timezone(user_tz, now()), 'YYYY-MM-DD');
        EXCEPTION WHEN OTHERS THEN
            current_hour_in_tz := EXTRACT(HOUR FROM timezone('UTC', now()))::int;
            today_in_tz := to_char(timezone('UTC', now()), 'YYYY-MM-DD');
        END;
        
        IF current_hour_in_tz = reminder_hour THEN
            IF r.last_active_date IS NULL OR r.last_active_date != today_in_tz THEN
                
                -- Pool of 50 dynamic messages
                msg_pool := ARRAY[
                    jsonb_build_object('title', 'Keep your streak active! 🇷🇺', 'body', 'Keep your ' || user_streak || '-day streak alive! Take a few minutes to review your Russian vocabulary today.'),
                    jsonb_build_object('title', 'Don''t break the chain! 🔗', 'body', 'You''ve built an awesome ' || user_streak || '-day streak. Keep the momentum going!'),
                    jsonb_build_object('title', user_streak || ' days and counting! 🚀', 'body', 'Your Russian is getting stronger every day. Log in for 3 minutes to keep your streak!'),
                    jsonb_build_object('title', 'Streak Protection Alert! 🛡️', 'body', 'Your ' || user_streak || '-day streak is about to reset. Take a quick 2-minute lesson to protect it!'),
                    jsonb_build_object('title', 'Consistency is key! 🔑', 'body', 'Small daily steps lead to fluency. Keep your ' || user_streak || '-day Russian streak active!'),
                    jsonb_build_object('title', 'You''re on fire! 🔥', 'body', 'Day ' || user_streak || ' of learning Russian! Review your due cards today to stay on top.'),
                    jsonb_build_object('title', 'Daily Goal Awaits! 🎯', 'body', 'Protect your ' || user_streak || '-day streak with a quick vocabulary review before the day ends.'),
                    jsonb_build_object('title', 'A streak worth bragging about! 🌟', 'body', 'You are on a ' || user_streak || '-day roll! Keep your momentum going today.'),
                    jsonb_build_object('title', 'Don''t let your streak slip! ⏳', 'body', 'A 3-minute study session is all it takes to keep your ' || user_streak || '-day streak alive.'),
                    jsonb_build_object('title', 'Champion Status: Unlocked! 🏆', 'body', user_streak || ' days of Russian learning. Let''s keep going!'),
                    jsonb_build_object('title', 'Привет! Ready to practice? 🇷🇺', 'body', 'Say hello to new Russian words today. Your review deck is waiting!'),
                    jsonb_build_object('title', 'Как дела? Time for Russian! 😊', 'body', 'Take a quick 2-minute break and sharpen your Russian vocabulary.'),
                    jsonb_build_object('title', 'Отличная работа! Keep it up! 💪', 'body', 'You''re building real Russian fluency step by step. Let''s practice now!'),
                    jsonb_build_object('title', 'Пора заниматься! 📚', 'body', 'Time to study! A quick set of flashcards is waiting for you.'),
                    jsonb_build_object('title', 'Добрый день! 🌞', 'body', 'A few words a day keeps forgetfulness away. Open Privyetik for a quick quiz!'),
                    jsonb_build_object('title', 'Удачи! Good luck with today''s deck 🍀', 'body', 'Test your memory on today''s due words and earn bonus XP!'),
                    jsonb_build_object('title', 'Готовы? (Ready?) 🎯', 'body', 'Your Russian flashcards are ready for review. Dive in now!'),
                    jsonb_build_object('title', 'Всё получится! (You can do it!) ✨', 'body', 'Mastering Russian takes practice. Take 3 minutes for your daily words.'),
                    jsonb_build_object('title', 'Русский язык ждёт! 📖', 'body', 'Russian is waiting! Keep your vocabulary fresh with a quick session.'),
                    jsonb_build_object('title', 'Быстро и просто! (Fast & Easy!) ⚡', 'body', 'Learn 5 new Russian words in less than 2 minutes today.'),
                    jsonb_build_object('title', 'Got 2 minutes? ⏱️', 'body', 'That''s all it takes to complete today''s Russian review deck!'),
                    jsonb_build_object('title', 'Quick 3-Minute Refresh ☕', 'body', 'Grab a coffee and flip through a quick set of Russian cards.'),
                    jsonb_build_object('title', 'Bite-sized Russian 🍪', 'body', 'No long study sessions needed—just a quick 5-card review!'),
                    jsonb_build_object('title', 'Fit learning into your day 🚶', 'body', 'Practice Russian on the go. Open Privyetik for a 60-second review.'),
                    jsonb_build_object('title', 'Micro-lesson time! 🧩', 'body', 'Review 10 due words right now and lock them into long-term memory.'),
                    jsonb_build_object('title', 'Just 5 cards today! 🃏', 'body', 'Knock out today''s due cards in 120 seconds!'),
                    jsonb_build_object('title', 'Your 2-minute Russian boost ⚡', 'body', 'Give your memory a quick boost with today''s spaced-repetition cards.'),
                    jsonb_build_object('title', 'Waiting in line? 🚶‍♂️', 'body', 'Turn idle minutes into Russian fluency. Open Privyetik!'),
                    jsonb_build_object('title', 'Supercharge your vocabulary 🚀', 'body', 'Spend 3 minutes today to remember words for a lifetime.'),
                    jsonb_build_object('title', 'Quick Brain Workout! 🧠', 'body', 'Exercise your memory with a fast Russian matching quiz.'),
                    jsonb_build_object('title', 'Perfect time for Spaced Repetition! 🧠', 'body', 'Your brain is at the optimal window to review today''s cards.'),
                    jsonb_build_object('title', 'Lock it into long-term memory 🔒', 'body', 'Reviewing words today moves them into higher Leitner boxes!'),
                    jsonb_build_object('title', 'Cards are due for review! 📅', 'body', 'Your scheduled cards need a quick check to prevent forgetting.'),
                    jsonb_build_object('title', 'Move words to Box 5! 📦', 'body', 'Level up your word mastery today in the Leitner system.'),
                    jsonb_build_object('title', 'Science says: Time to review! 🔬', 'body', 'Optimal spacing boosts retention by 80%. Review your cards now!'),
                    jsonb_build_object('title', 'Don''t let memory decay! 📉', 'body', 'Keep your hard-earned Russian words active in your memory bank.'),
                    jsonb_build_object('title', 'Your Leitner box awaits! 📥', 'body', 'Promote your cards to the next box with a flawless review score!'),
                    jsonb_build_object('title', 'Memory Checkpoint 🚩', 'body', 'Test how well you remember the words you learned earlier this week.'),
                    jsonb_build_object('title', 'Neural Pathways Reloading ⚡', 'body', 'Strengthen your Cyrillic memory connections with today''s practice.'),
                    jsonb_build_object('title', 'Mastery Level Increasing 📈', 'body', 'Every card reviewed today gets you closer to full Russian mastery.'),
                    jsonb_build_object('title', 'Mishka the Bear is waiting! 🐻', 'body', 'Your Russian study buddy wants to practice with you today!'),
                    jsonb_build_object('title', 'XP Boost Available! 🌟', 'body', 'Earn bonus XP today by clearing all your due flashcards.'),
                    jsonb_build_object('title', 'New High Score Ahead? 🎮', 'body', 'Log in today to earn XP and level up your Russian skills!'),
                    jsonb_build_object('title', 'Grammar Tutor is Ready! 🤖', 'body', 'Got questions on Russian cases? Take a quick AI Grammar quiz today.'),
                    jsonb_build_object('title', 'Alphabet & Vocab Challenge 🔤', 'body', 'Challenge yourself with a quick vocabulary writing drill!'),
                    jsonb_build_object('title', 'Your daily Russian quest! 🗡️', 'body', 'Complete today''s review quest and claim your daily study XP!'),
                    jsonb_build_object('title', 'Don''t disappoint your study mascot! 🐻', 'body', 'Privyetik mascot is keeping watch over your ' || user_streak || '-day streak!'),
                    jsonb_build_object('title', 'Level Up Your Russian! ⬆️', 'body', 'Practice today to unlock new CEFR vocabulary levels.'),
                    jsonb_build_object('title', 'Daily Study Reward 🎁', 'body', 'Finish today''s flashcard deck and claim your daily streak reward.'),
                    jsonb_build_object('title', 'Privyetik Time! 🇷🇺', 'body', 'Make today count! 3 minutes of Russian practice makes a big difference.')
                ];

                selected_msg := msg_pool[1 + floor(random() * 50)::int];

                SELECT net.http_post(
                    url := url_scheme || project_host || '/functions/v1/send-push',
                    body := jsonb_build_object(
                        'userId', r.user_id,
                        'title', selected_msg->>'title',
                        'body', selected_msg->>'body'
                    )::text,
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer ' || COALESCE(service_key, '')
                    )
                ) INTO request_id;

                -- Log the sent reminder in the database
                INSERT INTO public.reminder_logs (
                    user_id,
                    streak,
                    reminder_time,
                    notification_title,
                    notification_body,
                    status,
                    request_id
                ) VALUES (
                    r.user_id,
                    user_streak,
                    reminder_time,
                    selected_msg->>'title',
                    selected_msg->>'body',
                    'sent',
                    request_id
                );
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
