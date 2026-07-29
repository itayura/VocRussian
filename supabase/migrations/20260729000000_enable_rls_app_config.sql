-- Enable Row Level Security (RLS) on public.app_config table
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access (SELECT) for authenticated and anonymous users
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
