-- Supabase Schema Migration: Initial Database Structure
-- Created for VocRussian cross-device sync

-- 1. Create custom words & overrides table
CREATE TABLE IF NOT EXISTS public.voc_words (
    id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word text NOT NULL,
    accented text,
    translation text NOT NULL,
    transliteration text,
    pos text,
    category text,
    example_ru text,
    example_en text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT voc_words_pkey PRIMARY KEY (user_id, id)
);

-- Enable RLS on voc_words
ALTER TABLE public.voc_words ENABLE ROW LEVEL SECURITY;

-- Create policy for voc_words
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'voc_words' AND policyname = 'Users can manage their own words'
    ) THEN
        CREATE POLICY "Users can manage their own words" 
        ON public.voc_words 
        FOR ALL 
        TO authenticated 
        USING (auth.uid() = user_id) 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;


-- 2. Create spaced repetition progress table
CREATE TABLE IF NOT EXISTS public.voc_progress (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word_id text NOT NULL,
    box integer NOT NULL DEFAULT 1,
    next_review bigint NOT NULL,
    correct_count integer DEFAULT 0,
    wrong_count integer DEFAULT 0,
    starred boolean DEFAULT false,
    hidden boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT voc_progress_pkey PRIMARY KEY (user_id, word_id)
);

-- Enable RLS on voc_progress
ALTER TABLE public.voc_progress ENABLE ROW LEVEL SECURITY;

-- Create policy for voc_progress
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'voc_progress' AND policyname = 'Users can manage their own progress'
    ) THEN
        CREATE POLICY "Users can manage their own progress" 
        ON public.voc_progress 
        FOR ALL 
        TO authenticated 
        USING (auth.uid() = user_id) 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;


-- 3. Create global user statistics table
CREATE TABLE IF NOT EXISTS public.voc_stats (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    xp integer DEFAULT 0,
    streak integer DEFAULT 0,
    last_active_date text,
    total_correct integer DEFAULT 0,
    total_attempts integer DEFAULT 0,
    daily_xp_log jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on voc_stats
ALTER TABLE public.voc_stats ENABLE ROW LEVEL SECURITY;

-- Create policy for voc_stats
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'voc_stats' AND policyname = 'Users can manage their own stats'
    ) THEN
        CREATE POLICY "Users can manage their own stats" 
        ON public.voc_stats 
        FOR ALL 
        TO authenticated 
        USING (auth.uid() = user_id) 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;
