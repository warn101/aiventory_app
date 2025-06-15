/*
  # Seed Initial Data

  1. Categories
    - Insert predefined categories with icons and colors
  
  2. Sample Tools
    - Insert sample AI tools for demonstration
*/

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