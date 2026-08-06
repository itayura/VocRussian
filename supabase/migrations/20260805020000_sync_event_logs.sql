-- Event fragments allow deterministic merging of offline reviews and XP across devices.
ALTER TABLE public.voc_progress
  ADD COLUMN IF NOT EXISTS review_events jsonb DEFAULT '[]'::jsonb NOT NULL;

ALTER TABLE public.voc_stats
  ADD COLUMN IF NOT EXISTS activity_log jsonb DEFAULT '[]'::jsonb NOT NULL;
