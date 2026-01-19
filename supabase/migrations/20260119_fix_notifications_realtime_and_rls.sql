-- [MIGRATION] Enable Realtime and Full Replica Identity for notifications table
-- This ensures that real-time notifications (toasts and list updates) work reliably.

BEGIN;

-- 1. Ensure notifications table is in the supabase_realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- 2. Set REPLICA IDENTITY to FULL for notifications
-- This allows real-time filters (like receiver_id) to work reliably.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 3. Ensure proper RLS policies for notifications (just in case they are missing)
-- Allow users to insert notifications (senders)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Anyone can insert notifications'
    ) THEN
        CREATE POLICY "Anyone can insert notifications" 
        ON public.notifications
        FOR INSERT 
        WITH CHECK (true); -- Usually restricted to authenticated users but keeping it simple for now
    END IF;
END $$;

-- Allow users to see their own notifications (receivers)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can see their own notifications'
    ) THEN
        CREATE POLICY "Users can see their own notifications" 
        ON public.notifications
        FOR SELECT 
        USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = receiver_id));
    END IF;
END $$;

COMMIT;
