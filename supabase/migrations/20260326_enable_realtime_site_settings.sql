-- Enable Realtime for site_settings with Full Identity
BEGIN;
  -- Ensure the table sends full row data for updates
  ALTER TABLE public.site_settings REPLICA IDENTITY FULL;

  -- Add to publication for realtime
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
    ELSE
      CREATE PUBLICATION supabase_realtime FOR TABLE public.site_settings;
      ALTER PUBLICATION supabase_realtime SET (publish = 'insert, update, delete, truncate');
      ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
    END IF;
  EXCEPTION WHEN others THEN
    -- Table might already be in publication
    NULL;
  END $$;
COMMIT;
