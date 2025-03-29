-- Add default values to existing updatedAt fields
ALTER TABLE "Comment"
ALTER COLUMN "updatedAt"
SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Replies"
ALTER COLUMN "updatedAt"
SET DEFAULT CURRENT_TIMESTAMP;

-- Add content field to Replies if it doesn't exist
ALTER TABLE "Replies"
ADD COLUMN IF NOT EXISTS "content" TEXT NOT NULL DEFAULT 'Reply';