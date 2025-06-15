/*
  # Complete Database Schema Setup

  1. New Tables
    - `categories` - Tool categories with counts
    - `tools` - AI tools with all metadata
    - `profiles` - User profiles extending auth.users
    - `bookmarks` - User bookmarks for tools
    - `reviews` - User reviews and ratings for tools

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access where appropriate
    - Add policies for authenticated user operations
    - Secure user data access

  3. Functions & Triggers
    - Auto-create user profiles on signup
    - Auto-update tool ratings when reviews change
    - Auto-update category tool counts
    - Full-text search capabilities

  4. Performance
    - Indexes on frequently queried columns
    - Full-text search index for tools
    - Foreign key constraints for data integrity
*/

-- Create custom types (handle existing types)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_type') THEN
    CREATE TYPE pricing_type AS ENUM ('free', 'freemium', 'paid');
  END IF;
END $$;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  tools_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tools table
CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  pricing pricing_type DEFAULT 'free',
  rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  image_url text NOT NULL,
  website_url text NOT NULL,
  featured boolean DEFAULT false,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tools_category_fkey'
  ) THEN
    ALTER TABLE tools ADD CONSTRAINT tools_category_fkey 
    FOREIGN KEY (category) REFERENCES categories(id);
  END IF;
END $$;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  bio text,
  location text,
  website text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint for profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint for bookmarks if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookmarks_user_id_tool_id_key'
  ) THEN
    ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_id_tool_id_key 
    UNIQUE(user_id, tool_id);
  END IF;
END $$;

-- Add foreign key constraints for bookmarks if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookmarks_user_id_fkey'
  ) THEN
    ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookmarks_tool_id_fkey'
  ) THEN
    ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_tool_id_fkey 
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint for reviews if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_user_id_tool_id_key'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_tool_id_key 
    UNIQUE(user_id, tool_id);
  END IF;
END $$;

-- Add foreign key constraints for reviews if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_user_id_fkey'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_tool_id_fkey'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_tool_id_fkey 
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_featured ON tools(featured);
CREATE INDEX IF NOT EXISTS idx_tools_rating ON tools(rating);
CREATE INDEX IF NOT EXISTS idx_tools_created_at ON tools(created_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tool_id ON reviews(tool_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Create full-text search function
CREATE OR REPLACE FUNCTION tools_search_vector(name text, description text, tags text[])
RETURNS tsvector AS $$
BEGIN
  RETURN to_tsvector('english', name || ' ' || description || ' ' || array_to_string(tags, ' '));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_tools_search ON tools USING gin(tools_search_vector(name, description, tags));

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone"
  ON categories
  FOR SELECT
  TO public
  USING (true);

-- Tools policies (public read)
DROP POLICY IF EXISTS "Tools are viewable by everyone" ON tools;
CREATE POLICY "Tools are viewable by everyone"
  ON tools
  FOR SELECT
  TO public
  USING (true);

-- Profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Bookmarks policies
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON bookmarks;
CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reviews policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
CREATE POLICY "Users can insert own reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update tools rating when reviews change
CREATE OR REPLACE FUNCTION update_tool_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE tools 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews 
      WHERE tool_id = COALESCE(NEW.tool_id, OLD.tool_id)
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM reviews 
      WHERE tool_id = COALESCE(NEW.tool_id, OLD.tool_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.tool_id, OLD.tool_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to update tool rating
DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_tool_rating();

-- Function to update category tools count
CREATE OR REPLACE FUNCTION update_category_count()
RETURNS trigger AS $$
BEGIN
  -- Update old category count
  IF OLD.category IS NOT NULL THEN
    UPDATE categories 
    SET tools_count = (
      SELECT COUNT(*) FROM tools WHERE category = OLD.category
    )
    WHERE id = OLD.category;
  END IF;
  
  -- Update new category count
  IF NEW.category IS NOT NULL THEN
    UPDATE categories 
    SET tools_count = (
      SELECT COUNT(*) FROM tools WHERE category = NEW.category
    )
    WHERE id = NEW.category;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update category count (FIXED: correct function name)
DROP TRIGGER IF EXISTS on_tool_category_change ON tools;
CREATE TRIGGER on_tool_category_change
  AFTER INSERT OR UPDATE OR DELETE ON tools
  FOR EACH ROW EXECUTE FUNCTION update_category_count();