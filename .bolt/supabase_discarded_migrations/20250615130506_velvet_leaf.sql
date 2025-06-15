/*
  # Complete AIventory Database Schema

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
      - `category` (text, foreign key to categories)
      - `pricing` (pricing_type enum)
      - `rating` (numeric, 0-5 range)
      - `reviews_count` (integer, default 0)
      - `tags` (text array)
      - `image_url` (text)
      - `website_url` (text)
      - `featured` (boolean, default false)
      - `verified` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `profiles`
      - `id` (uuid, primary key, foreign key to auth.users)
      - `name` (text)
      - `email` (text)
      - `avatar_url` (text, nullable)
      - `bio` (text, nullable)
      - `location` (text, nullable)
      - `website` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `bookmarks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `tool_id` (uuid, foreign key to tools)
      - `created_at` (timestamp)
    
    - `reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `tool_id` (uuid, foreign key to tools)
      - `rating` (integer, 1-5 range)
      - `comment` (text)
      - `helpful_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (tools, categories)
    - Add policies for authenticated user access (profiles, bookmarks, reviews)

  3. Functions & Triggers
    - Auto-create user profiles on signup
    - Auto-update tool ratings when reviews change
    - Auto-update category tool counts when tools change

  4. Indexes
    - Performance indexes for frequently queried columns
    - Full-text search index for tools
    - Unique constraints where needed

  5. Initial Data
    - Pre-populate categories
    - Add sample tools for demonstration
*/

-- Create custom types
DO $$ BEGIN
  CREATE TYPE pricing_type AS ENUM ('free', 'freemium', 'paid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  tools_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create tools table
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

-- Create profiles table
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

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

-- Create reviews table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_rating ON tools(rating);
CREATE INDEX IF NOT EXISTS idx_tools_featured ON tools(featured);
CREATE INDEX IF NOT EXISTS idx_tools_created_at ON tools(created_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tool_id ON reviews(tool_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Create full-text search function and index
CREATE OR REPLACE FUNCTION tools_search_vector(name text, description text, tags text[])
RETURNS tsvector AS $$
BEGIN
  RETURN to_tsvector('english', name || ' ' || description || ' ' || array_to_string(tags, ' '));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE INDEX IF NOT EXISTS idx_tools_search ON tools USING gin(tools_search_vector(name, description, tags));

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Categories: Public read access
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  TO public
  USING (true);

-- Tools: Public read access
DROP POLICY IF EXISTS "Tools are viewable by everyone" ON tools;
CREATE POLICY "Tools are viewable by everyone"
  ON tools FOR SELECT
  TO public
  USING (true);

-- Profiles: Users can view all profiles, but only update their own
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Bookmarks: Users can only access their own bookmarks
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON bookmarks;
CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reviews: Public read, authenticated users can manage their own
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update tool rating
CREATE OR REPLACE FUNCTION update_tool_rating()
RETURNS trigger AS $$
DECLARE
  tool_id_to_update uuid;
  avg_rating numeric;
  review_count integer;
BEGIN
  -- Determine which tool to update
  IF TG_OP = 'DELETE' THEN
    tool_id_to_update := OLD.tool_id;
  ELSE
    tool_id_to_update := NEW.tool_id;
  END IF;

  -- Calculate new average rating and count
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO avg_rating, review_count
  FROM reviews 
  WHERE tool_id = tool_id_to_update;

  -- Update the tool
  UPDATE tools 
  SET 
    rating = ROUND(avg_rating, 2),
    reviews_count = review_count,
    updated_at = now()
  WHERE id = tool_id_to_update;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review changes
DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_tool_rating();

-- Create function to update category count
CREATE OR REPLACE FUNCTION update_category_count()
RETURNS trigger AS $$
DECLARE
  old_category text;
  new_category text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    old_category := OLD.category;
  ELSIF TG_OP = 'INSERT' THEN
    new_category := NEW.category;
  ELSIF TG_OP = 'UPDATE' THEN
    old_category := OLD.category;
    new_category := NEW.category;
  END IF;

  -- Update old category count
  IF old_category IS NOT NULL THEN
    UPDATE categories 
    SET tools_count = (
      SELECT COUNT(*) FROM tools WHERE category = old_category
    )
    WHERE id = old_category;
  END IF;

  -- Update new category count
  IF new_category IS NOT NULL AND (old_category IS NULL OR old_category != new_category) THEN
    UPDATE categories 
    SET tools_count = (
      SELECT COUNT(*) FROM tools WHERE category = new_category
    )
    WHERE id = new_category;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tool category changes
DROP TRIGGER IF EXISTS on_tool_category_change ON tools;
CREATE TRIGGER on_tool_category_change
  AFTER INSERT OR UPDATE OR DELETE ON tools
  FOR EACH ROW EXECUTE FUNCTION update_category_count();

-- Insert initial categories
INSERT INTO categories (id, name, icon, color) VALUES
  ('text-generation', 'Text Generation', 'FileText', 'bg-blue-500'),
  ('image-generation', 'Image Generation', 'Image', 'bg-purple-500'),
  ('developer-tools', 'Developer Tools', 'Code', 'bg-green-500'),
  ('productivity', 'Productivity', 'Zap', 'bg-orange-500'),
  ('video-editing', 'Video Editing', 'Video', 'bg-red-500'),
  ('audio-tools', 'Audio Tools', 'Music', 'bg-pink-500'),
  ('data-analysis', 'Data Analysis', 'BarChart', 'bg-teal-500'),
  ('design-tools', 'Design Tools', 'Palette', 'bg-indigo-500')
ON CONFLICT (id) DO NOTHING;

-- Insert sample tools
INSERT INTO tools (name, description, category, pricing, rating, reviews_count, tags, image_url, website_url, featured, verified) VALUES
  (
    'ChatGPT',
    'Advanced conversational AI for natural language understanding and generation',
    'text-generation',
    'freemium',
    4.8,
    15420,
    ARRAY['conversation', 'writing', 'analysis', 'coding'],
    'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://chat.openai.com',
    true,
    true
  ),
  (
    'Midjourney',
    'AI-powered image generation with stunning artistic capabilities',
    'image-generation',
    'paid',
    4.9,
    8930,
    ARRAY['art', 'design', 'creative', 'visual'],
    'https://images.pexels.com/photos/8849295/pexels-photo-8849295.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://midjourney.com',
    true,
    true
  ),
  (
    'GitHub Copilot',
    'AI pair programmer that helps you write code faster',
    'developer-tools',
    'paid',
    4.7,
    12300,
    ARRAY['coding', 'development', 'programming', 'productivity'],
    'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://github.com/features/copilot',
    true,
    true
  ),
  (
    'Notion AI',
    'AI-powered writing assistant integrated into your workspace',
    'productivity',
    'freemium',
    4.6,
    5670,
    ARRAY['writing', 'productivity', 'notes', 'organization'],
    'https://images.pexels.com/photos/3184299/pexels-photo-3184299.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://notion.so/ai',
    false,
    true
  ),
  (
    'Runway ML',
    'Creative AI tools for video editing and generation',
    'video-editing',
    'freemium',
    4.5,
    3240,
    ARRAY['video', 'editing', 'creative', 'generation'],
    'https://images.pexels.com/photos/3862132/pexels-photo-3862132.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://runwayml.com',
    false,
    true
  ),
  (
    'Grammarly',
    'AI-powered writing assistant for grammar and style',
    'text-generation',
    'freemium',
    4.4,
    18920,
    ARRAY['writing', 'grammar', 'editing', 'productivity'],
    'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://grammarly.com',
    false,
    true
  )
ON CONFLICT (id) DO NOTHING;