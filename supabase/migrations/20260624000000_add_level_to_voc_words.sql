-- Add level column to public.voc_words if it does not exist
ALTER TABLE public.voc_words ADD COLUMN IF NOT EXISTS level text;
