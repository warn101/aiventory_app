/*
  # Complete AIventory Database Schema and Initial Data

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

  3. Initial Data
    - Insert categories and sample tools
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

-- Create immutable function for full-text search
CREATE OR REPLACE FUNCTION tools_search_vector(name text, description text, tags text[])
RETURNS tsvector AS $$
BEGIN
  RETURN to_tsvector('english', name || ' ' || description || ' ' || array_to_string(tags, ' '));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create full-text search index using the immutable function
CREATE INDEX IF NOT EXISTS idx_tools_search ON tools USING gin(tools_search_vector(name, description, tags));

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

-- Insert categories
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
    'Advanced conversational AI for natural language understanding and generation. Perfect for writing, coding, analysis, and creative tasks.',
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
    'AI-powered image generation with stunning artistic capabilities. Create beautiful, unique artwork from simple text descriptions.',
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
    'AI pair programmer that helps you write code faster. Get intelligent code suggestions and completions in real-time.',
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
    'AI-powered writing assistant integrated into your workspace. Enhance your productivity with intelligent content generation.',
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
    'Creative AI tools for video editing and generation. Transform your video content with cutting-edge AI technology.',
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
    'AI-powered writing assistant for grammar and style. Improve your writing with intelligent suggestions and corrections.',
    'text-generation',
    'freemium',
    4.4,
    18920,
    ARRAY['writing', 'grammar', 'editing', 'productivity'],
    'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://grammarly.com',
    false,
    true
  ),
  (
    'DALL-E 3',
    'Create realistic images and art from a description in natural language. The most advanced AI image generator available.',
    'image-generation',
    'paid',
    4.6,
    7850,
    ARRAY['art', 'image', 'creative', 'generation'],
    'https://images.pexels.com/photos/8849295/pexels-photo-8849295.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://openai.com/dall-e-3',
    false,
    true
  ),
  (
    'Figma AI',
    'AI-powered design tools integrated into Figma. Streamline your design workflow with intelligent automation.',
    'design-tools',
    'freemium',
    4.3,
    4560,
    ARRAY['design', 'ui', 'ux', 'collaboration'],
    'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://figma.com',
    false,
    true
  ),
  (
    'Tableau AI',
    'AI-powered data visualization and analytics. Transform your data into actionable insights with intelligent analysis.',
    'data-analysis',
    'paid',
    4.5,
    6780,
    ARRAY['data', 'analytics', 'visualization', 'business'],
    'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://tableau.com',
    false,
    true
  ),
  (
    'Murf AI',
    'AI voice generator for creating realistic voiceovers. Generate professional-quality speech from text in minutes.',
    'audio-tools',
    'freemium',
    4.4,
    3450,
    ARRAY['voice', 'audio', 'speech', 'generation'],
    'https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://murf.ai',
    false,
    true
  ),
  (
    'Stable Diffusion',
    'Open-source AI image generation model. Create high-quality images with complete control and customization.',
    'image-generation',
    'free',
    4.3,
    9240,
    ARRAY['open-source', 'image', 'generation', 'customizable'],
    'https://images.pexels.com/photos/8849295/pexels-photo-8849295.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://stability.ai',
    false,
    true
  ),
  (
    'Claude',
    'Advanced AI assistant for analysis, writing, and coding. Engage in thoughtful conversations and get expert assistance.',
    'text-generation',
    'freemium',
    4.7,
    11200,
    ARRAY['conversation', 'analysis', 'writing', 'coding'],
    'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://claude.ai',
    true,
    true
  ),
  (
    'Canva AI',
    'AI-powered design platform for creating stunning visuals. Design like a pro with intelligent templates and suggestions.',
    'design-tools',
    'freemium',
    4.4,
    8760,
    ARRAY['design', 'templates', 'graphics', 'marketing'],
    'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://canva.com',
    false,
    true
  ),
  (
    'Cursor',
    'AI-powered code editor built for productivity. Write code faster with intelligent completions and suggestions.',
    'developer-tools',
    'freemium',
    4.6,
    5430,
    ARRAY['coding', 'editor', 'productivity', 'ai-assistance'],
    'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://cursor.sh',
    false,
    true
  ),
  (
    'Luma AI',
    'AI-powered 3D capture and generation. Create stunning 3D content from photos and videos with ease.',
    'video-editing',
    'freemium',
    4.2,
    2180,
    ARRAY['3d', 'capture', 'generation', 'ar'],
    'https://images.pexels.com/photos/3862132/pexels-photo-3862132.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://lumalabs.ai',
    false,
    true
  )
ON CONFLICT DO NOTHING;