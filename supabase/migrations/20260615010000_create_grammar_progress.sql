-- Create grammar progress table
CREATE TABLE IF NOT EXISTS public.voc_grammar_progress (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id text NOT NULL,
    lessons_completed integer DEFAULT 0 NOT NULL,
    quizzes_taken integer DEFAULT 0 NOT NULL,
    avg_score integer DEFAULT 0 NOT NULL,
    last_practiced timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT voc_grammar_progress_pkey PRIMARY KEY (user_id, topic_id)
);

-- Enable RLS
ALTER TABLE public.voc_grammar_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own grammar progress
CREATE POLICY "Users can manage their own grammar progress" 
ON public.voc_grammar_progress 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
