-- Complete the custom-deck schema and harden scheduled reminder functions.
ALTER TABLE public.voc_words
  ADD COLUMN IF NOT EXISTS deck_id text DEFAULT 'custom' NOT NULL;

CREATE INDEX IF NOT EXISTS voc_words_user_deck_idx
  ON public.voc_words (user_id, deck_id);

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
DO $$
BEGIN
  IF to_regprocedure('private.get_service_role_key()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION private.get_service_role_key() FROM PUBLIC, anon, authenticated';
  END IF;
  IF to_regprocedure('public.check_and_send_reminders()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.check_and_send_reminders() FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.get_service_role_key();


-- Only authenticated users may create or inspect their own rate-limit entries.
DROP POLICY IF EXISTS "Anyone can insert AI request logs" ON public.voc_ai_request_logs;
DROP POLICY IF EXISTS "Users can insert their own AI logs" ON public.voc_ai_request_logs;
CREATE POLICY "Users can insert their own AI logs"
  ON public.voc_ai_request_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
REVOKE ALL ON public.voc_ai_request_logs FROM anon;
GRANT SELECT, INSERT ON public.voc_ai_request_logs TO authenticated;


-- Prevent anonymous feedback spam and identity spoofing.
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.voc_feedback;
DROP POLICY IF EXISTS "Users can submit their own feedback" ON public.voc_feedback;
CREATE POLICY "Users can submit their own feedback"
  ON public.voc_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_email = COALESCE(auth.jwt() ->> 'email', ''));
REVOKE INSERT ON public.voc_feedback FROM anon;
GRANT INSERT ON public.voc_feedback TO authenticated;
ALTER TABLE public.voc_feedback DROP CONSTRAINT IF EXISTS voc_feedback_title_length;
ALTER TABLE public.voc_feedback
  ADD CONSTRAINT voc_feedback_title_length CHECK (char_length(title) BETWEEN 1 AND 200) NOT VALID;
ALTER TABLE public.voc_feedback DROP CONSTRAINT IF EXISTS voc_feedback_description_length;
ALTER TABLE public.voc_feedback
  ADD CONSTRAINT voc_feedback_description_length CHECK (char_length(description) BETWEEN 1 AND 5000) NOT VALID;

CREATE INDEX IF NOT EXISTS voc_ai_request_logs_user_created_idx
  ON public.voc_ai_request_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reminder_logs_user_sent_idx
  ON public.reminder_logs (user_id, sent_at DESC);
