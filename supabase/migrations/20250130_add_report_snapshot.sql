-- Add content_snapshot column to reports table for persisting deleted content
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS content_snapshot JSONB;

COMMENT ON COLUMN public.reports.content_snapshot IS 'Snapshot of the reported content at the time of reporting. Used for admin review if original content is deleted.';
