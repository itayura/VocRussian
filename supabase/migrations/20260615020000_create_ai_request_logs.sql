-- Create AI request logs table for rate limiting
CREATE TABLE IF NOT EXISTS public.voc_ai_request_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.voc_ai_request_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own logs
CREATE POLICY "Users can insert their own AI logs" 
ON public.voc_ai_request_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own logs
CREATE POLICY "Users can view their own AI logs" 
ON public.voc_ai_request_logs 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
