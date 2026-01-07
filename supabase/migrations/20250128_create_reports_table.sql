-- ==========================================
-- reports Table Creation
-- ==========================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT reports_target_type_check CHECK (target_type IN ('tweet', 'reply', 'user', 'chat')),
    CONSTRAINT reports_status_check CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed'))
);

-- 2. Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Clean up any existing policies
DO $$ 
DECLARE pol record;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'reports'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON reports', pol.policyname);
    END LOOP;
END $$;

-- INSERT: Authenticated users can create reports
CREATE POLICY "reports_insert" ON public.reports
    FOR INSERT
    WITH CHECK (
        -- Can only report as yourself
        reporter_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

-- SELECT: Users can view their own reports
CREATE POLICY "reports_select_own" ON public.reports
    FOR SELECT
    USING (
        reporter_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

-- SELECT/UPDATE: Admins can view and update all reports
CREATE POLICY "reports_admin_all" ON public.reports
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Comments
COMMENT ON TABLE public.reports IS 'Stores user reports for content modulation';
COMMENT ON COLUMN public.reports.reporter_id IS 'Profile ID of the user submitting the report';
COMMENT ON COLUMN public.reports.target_type IS 'Type of content being reported: tweet, reply, or user';
COMMENT ON COLUMN public.reports.reason IS 'Reason category e.g. spam, abuse, other';
COMMENT ON COLUMN public.reports.description IS 'Detailed description, required if reason is other';
