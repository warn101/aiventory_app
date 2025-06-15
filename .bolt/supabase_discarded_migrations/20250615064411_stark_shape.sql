/*
  # Initial Schema Setup for AIventory

  1. New Tables
    - `categories`
      - `id` (text, primary key)
      - `name` (text)
      - `icon` (text)
      - `color` (text)
      - `tools_count` (integer, default 0)
      - `created_at` (timestamp)
    
    - `tools`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text, foreign key)
      - `pricing` (enum: free, freemium, paid)
      - `rating` (numeric, default 0)
      - `reviews_count` (integer, default 0)
      - `tags` (text array)
      - `image_url` (text)
      - `website_url` (text)
      - `featured` (boolean, default false)
      - `verified` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `email` (text)
      - `avatar_url` (text)
      - `bio` (text)
      - `location` (text)
      - `website` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `bookmarks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `tool_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `tool_id` (uuid, foreign key)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `helpful_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to tools and categories
*/

-- Create custom types
CREATE TYPE pricing_type AS ENUM ('free', 'freemium', 'paid');

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
  category text NOT NULL REFERENCES categories(id),
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

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  bio text,
  location text,
  website text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_featured ON tools(featured);
CREATE INDEX IF NOT EXISTS idx_tools_rating ON tools(rating);
CREATE INDEX IF NOT EXISTS idx_tools_created_at ON tools(created_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tool_id ON reviews(tool_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_tools_search ON tools USING gin(to_tsvector('english', name || ' ' || description || ' ' || array_to_string(tags, ' ')));

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read)
CREATE POLICY "Categories are viewable by everyone"
  ON categories
  FOR SELECT
  TO public
  USING (true);

-- Tools policies (public read)
CREATE POLICY "Tools are viewable by everyone"
  ON tools
  FOR SELECT
  TO public
  USING (true);

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

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

-- Trigger to update category count
DROP TRIGGER IF EXISTS on_tool_category_change ON tools;
CREATE TRIGGER on_tool_category_change
  AFTER INSERT OR UPDATE OR DELETE ON tools
  FOR EACH ROW EXECUTE FUNCTION update_category_count();