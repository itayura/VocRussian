-- SQL Migration: Feedback Table & Row Level Security (RLS) Policies

-- 1. Create feedback table
CREATE TABLE IF NOT EXISTS public.voc_feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email text DEFAULT 'Anonymous',
    type text NOT NULL CHECK (type IN ('bug', 'feature')),
    title text NOT NULL,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.voc_feedback ENABLE ROW LEVEL SECURITY;

-- 2. Create policies
-- Policy A: Anyone can insert feedback (public access)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'voc_feedback' AND policyname = 'Anyone can submit feedback'
    ) THEN
        CREATE POLICY "Anyone can submit feedback" 
        ON public.voc_feedback 
        FOR INSERT 
        WITH CHECK (true);
    END IF;
END
$$;

-- Policy B: Only the admin (itayuralevich@gmail.com) can read feedback
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'voc_feedback' AND policyname = 'Admin can view all feedback'
    ) THEN
        CREATE POLICY "Admin can view all feedback" 
        ON public.voc_feedback 
        FOR SELECT 
        TO authenticated 
        USING (auth.jwt() ->> 'email' = 'itayuralevich@gmail.com');
    END IF;
END
$$;

-- Policy C: Only the admin can update feedback status/details
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'voc_feedback' AND policyname = 'Admin can update feedback status'
    ) THEN
        CREATE POLICY "Admin can update feedback status" 
        ON public.voc_feedback 
        FOR UPDATE 
        TO authenticated 
        USING (auth.jwt() ->> 'email' = 'itayuralevich@gmail.com')
        WITH CHECK (auth.jwt() ->> 'email' = 'itayuralevich@gmail.com');
    END IF;
END
$$;

-- Policy D: Only the admin can delete feedback
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'voc_feedback' AND policyname = 'Admin can delete feedback'
    ) THEN
        CREATE POLICY "Admin can delete feedback" 
        ON public.voc_feedback 
        FOR DELETE 
        TO authenticated 
        USING (auth.jwt() ->> 'email' = 'itayuralevich@gmail.com');
    END IF;
END
$$;
