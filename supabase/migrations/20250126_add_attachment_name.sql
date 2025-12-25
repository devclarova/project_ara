-- Add name column to direct_message_attachments table to store filenames
ALTER TABLE direct_message_attachments
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN direct_message_attachments.name IS 'Original filename of the attachment';
