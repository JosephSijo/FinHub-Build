-- Enable RLS on user_catalog_link if not already enabled
ALTER TABLE user_catalog_link ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own links
CREATE POLICY "Users can view own catalog links"
ON user_catalog_link FOR SELECT
USING (auth.uid() = user_id);

-- Policy to allow users to insert their own links
CREATE POLICY "Users can insert own catalog links"
ON user_catalog_link FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own links
CREATE POLICY "Users can update own catalog links"
ON user_catalog_link FOR UPDATE
USING (auth.uid() = user_id);

-- Policy to allow users to delete their own links
CREATE POLICY "Users can delete own catalog links"
ON user_catalog_link FOR DELETE
USING (auth.uid() = user_id);
