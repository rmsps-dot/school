-- Add edit_request and delete_request columns to results table
ALTER TABLE results ADD COLUMN edit_request JSONB DEFAULT NULL;
ALTER TABLE results ADD COLUMN delete_request BOOLEAN DEFAULT FALSE;
