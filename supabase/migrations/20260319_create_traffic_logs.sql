-- Create traffic_logs table to store ad-block resistant acquisition data
CREATE TABLE IF NOT EXISTS public.traffic_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer TEXT,
    landing_page TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.traffic_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own logs
CREATE POLICY "Users can insert their own traffic logs"
    ON public.traffic_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow admins to read all traffic logs
CREATE POLICY "Admins can view all traffic logs"
    ON public.traffic_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_traffic_logs_user_id ON public.traffic_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_created_at ON public.traffic_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_utm_source ON public.traffic_logs(utm_source);
