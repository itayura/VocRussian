-- Alter voc_ai_request_logs to support IP logging and anonymous users
ALTER TABLE public.voc_ai_request_logs 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.voc_ai_request_logs 
ADD COLUMN IF NOT EXISTS ip_address text DEFAULT 'unknown' NOT NULL;

-- Update RLS policies to allow inserts for both anonymous and authenticated users
DROP POLICY IF EXISTS "Users can insert their own AI logs" ON public.voc_ai_request_logs;

CREATE POLICY "Anyone can insert AI request logs" 
ON public.voc_ai_request_logs 
FOR INSERT 
WITH CHECK (true);

-- Maintain select policy so users can only view their own logs
DROP POLICY IF EXISTS "Users can view their own AI logs" ON public.voc_ai_request_logs;

CREATE POLICY "Users can view their own AI logs" 
ON public.voc_ai_request_logs 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
