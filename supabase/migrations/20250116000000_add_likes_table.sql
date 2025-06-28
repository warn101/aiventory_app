/*
  # Add Likes/Upvotes Feature
  
  1. New Table
    - `likes` - User likes for tools with unique constraint
  
  2. Security
    - Enable RLS on likes table
    - Add policies for authenticated user operations
  
  3. Performance
    - Add indexes for common queries
    - Function to get like counts efficiently
*/

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint for likes if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'likes_user_id_tool_id_key' 
    AND table_name = 'likes'
  ) THEN
    ALTER TABLE likes ADD CONSTRAINT likes_user_id_tool_id_key 
    UNIQUE(user_id, tool_id);
  END IF;
END $$;

-- Add foreign key constraints for likes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'likes_user_id_fkey' 
    AND table_name = 'likes'
  ) THEN
    ALTER TABLE likes ADD CONSTRAINT likes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'likes_tool_id_fkey' 
    AND table_name = 'likes'
  ) THEN
    ALTER TABLE likes ADD CONSTRAINT likes_tool_id_fkey 
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_tool_id ON likes(tool_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at);

-- Enable Row Level Security
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Likes policies
DROP POLICY IF EXISTS "Users can view all likes" ON likes;
CREATE POLICY "Users can view all likes"
  ON likes
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can insert own likes" ON likes;
CREATE POLICY "Users can insert own likes"
  ON likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
CREATE POLICY "Users can delete own likes"
  ON likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to get like count and user like status for a tool
CREATE OR REPLACE FUNCTION get_tool_likes(tool_uuid uuid, user_uuid uuid DEFAULT NULL)
RETURNS TABLE(
  like_count bigint,
  user_liked boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as like_count,
    CASE 
      WHEN user_uuid IS NULL THEN false
      ELSE EXISTS(
        SELECT 1 FROM likes 
        WHERE tool_id = tool_uuid AND user_id = user_uuid
      )
    END as user_liked
  FROM likes 
  WHERE tool_id = tool_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle like (like/unlike)
CREATE OR REPLACE FUNCTION toggle_like(tool_uuid uuid, user_uuid uuid)
RETURNS TABLE(
  like_count bigint,
  user_liked boolean
) AS $$
DECLARE
  existing_like_id uuid;
BEGIN
  -- Check if like already exists
  SELECT id INTO existing_like_id
  FROM likes 
  WHERE tool_id = tool_uuid AND user_id = user_uuid;
  
  IF existing_like_id IS NOT NULL THEN
    -- Unlike: remove the like
    DELETE FROM likes WHERE id = existing_like_id;
  ELSE
    -- Like: add the like
    INSERT INTO likes (user_id, tool_id) VALUES (user_uuid, tool_uuid);
  END IF;
  
  -- Return updated counts
  RETURN QUERY
  SELECT * FROM get_tool_likes(tool_uuid, user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;