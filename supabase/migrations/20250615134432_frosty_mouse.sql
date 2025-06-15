/*
  # Populate database with initial data

  1. Categories
    - Insert predefined categories with icons and colors
  
  2. Tools
    - Insert sample AI tools with all required fields
    - Set proper relationships with categories
  
  3. Data Setup
    - Ensures the application has data to display immediately
    - Matches the structure expected by the frontend components
*/

-- Insert categories
INSERT INTO categories (id, name, icon, color, tools_count) VALUES
('text-generation', 'Text Generation', 'FileText', 'bg-blue-500', 0),
('image-generation', 'Image Generation', 'Image', 'bg-purple-500', 0),
('developer-tools', 'Developer Tools', 'Code', 'bg-green-500', 0),
('productivity', 'Productivity', 'Zap', 'bg-orange-500', 0),
('video-editing', 'Video Editing', 'Video', 'bg-red-500', 0),
('audio-tools', 'Audio Tools', 'Music', 'bg-pink-500', 0),
('data-analysis', 'Data Analysis', 'BarChart', 'bg-teal-500', 0),
('design-tools', 'Design Tools', 'Palette', 'bg-indigo-500', 0)
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
),
(
  'DALL-E 2',
  'Create realistic images and art from a description in natural language',
  'image-generation',
  'paid',
  4.6,
  7850,
  ARRAY['art', 'image', 'creative', 'generation'],
  'https://images.pexels.com/photos/8849295/pexels-photo-8849295.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://openai.com/dall-e-2/',
  false,
  true
),
(
  'Figma AI',
  'AI-powered design tools for creating stunning interfaces',
  'design-tools',
  'freemium',
  4.5,
  9200,
  ARRAY['design', 'ui', 'interface', 'collaboration'],
  'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://figma.com',
  false,
  true
),
(
  'Murf AI',
  'AI voice generator for creating realistic voiceovers',
  'audio-tools',
  'freemium',
  4.3,
  4560,
  ARRAY['voice', 'audio', 'speech', 'generation'],
  'https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://murf.ai',
  false,
  true
),
(
  'Tableau AI',
  'Advanced data visualization and analytics platform',
  'data-analysis',
  'paid',
  4.4,
  6780,
  ARRAY['data', 'analytics', 'visualization', 'business'],
  'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://tableau.com',
  false,
  true
);