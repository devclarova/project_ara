-- Add metadata column to reports table for storing extra context (e.g. reported message IDs)
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMENT ON COLUMN public.reports.metadata IS 'Structured data providing context (e.g. { reported_message_ids: [] })';
