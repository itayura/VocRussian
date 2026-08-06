-- Preserve exact quiz evidence and immutable attempt IDs for conflict-safe grammar sync.
ALTER TABLE public.voc_grammar_progress
  ADD COLUMN IF NOT EXISTS total_correct integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS total_questions integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS attempts jsonb DEFAULT '[]'::jsonb NOT NULL;
