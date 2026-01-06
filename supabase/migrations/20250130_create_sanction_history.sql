-- Create Sanction History Table
CREATE TABLE IF NOT EXISTS public.sanction_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- User being sanctioned (Profile ID)
    sanction_type TEXT NOT NULL, -- 'ban', 'warning', etc.
    duration_days INTEGER, -- NULL for permanent or warning
    reason TEXT, -- 'spam', 'abuse', etc.
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Admin who performed the action
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT sanction_type_check CHECK (sanction_type IN ('ban', 'permanent_ban', 'warning'))
);

-- Enable RLS
ALTER TABLE public.sanction_history ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admin Full Access
CREATE POLICY "sanction_history_admin_all" ON public.sanction_history
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- User Read Access (Own history)
CREATE POLICY "sanction_history_user_read" ON public.sanction_history
    FOR SELECT
    USING (
         target_user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    );

-- Comments
COMMENT ON TABLE public.sanction_history IS 'Log of sanctions applied to users';
