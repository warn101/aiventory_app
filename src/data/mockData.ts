import { Tool, Category } from '../types';

export const mockTools: Tool[] = [
  {
    id: '1',
    name: 'ChatGPT',
    description: 'Advanced conversational AI for natural language understanding and generation',
    category: 'text-generation',
    pricing: 'freemium',
    rating: 4.8,
    reviews: 15420,
    tags: ['conversation', 'writing', 'analysis', 'coding'],
    image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400',
    url: 'https://chat.openai.com',
    featured: true,
    verified: true,
    addedDate: '2023-01-15',
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    name: 'Midjourney',
    description: 'AI-powered image generation with stunning artistic capabilities',
    category: 'image-generation',
    pricing: 'paid',
    rating: 4.9,
    reviews: 8930,
    tags: ['art', 'design', 'creative', 'visual'],
    image: 'https://images.pexels.com/photos/8849295/pexels-photo-8849295.jpeg?auto=compress&cs=tinysrgb&w=400',
    url: 'https://midjourney.com',
    featured: true,
    verified: true,
    addedDate: '2023-02-20',
    lastUpdated: '2024-01-10'
  },
  {
    id: '3',
    name: 'GitHub Copilot',
    description: 'AI pair programmer that helps you write code faster',
    category: 'developer-tools',
    pricing: 'paid',
    rating: 4.7,
    reviews: 12300,
    tags: ['coding', 'development', 'programming', 'productivity'],
    image: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=400',
    url: 'https://github.com/features/copilot',
    featured: true,
    verified: true,
    addedDate: '2023-03-10',
    lastUpdated: '2024-01-08'
  },
  {
    id: '4',
    name: 'Notion AI',
    description: 'AI-powered writing assistant integrated into your workspace',
    category: 'productivity',
    pricing: 'freemium',
    rating: 4.6,
    reviews: 5670,
    tags: ['writing', 'productivity', 'notes', 'organization'],
    image: 'https://images.pexels.com/photos/3184299/pexels-photo-3184299.jpeg?auto=compress&cs=tinysrgb&w=400',
    url: 'https://notion.so/ai',
    featured: false,
    verified: true,
    addedDate: '2023-04-05',
    lastUpdated: '2024-01-05'
  },
  {
    id: '5',
    name: 'Runway ML',
    description: 'Creative AI tools for video editing and generation',
    category: 'video-editing',
    pricing: 'freemium',
    rating: 4.5,
    reviews: 3240,
    tags: ['video', 'editing', 'creative', 'generation'],
    image: 'https://images.pexels.com/photos/3862132/pexels-photo-3862132.jpeg?auto=compress&cs=tinysrgb&w=400',
    url: 'https://runwayml.com',
    featured: false,
    verified: true,
    addedDate: '2023-05-12',
    lastUpdated: '2024-01-03'
  },
  {
    id: '6',
    name: 'Grammarly',
    description: 'AI-powered writing assistant for grammar and style',
    category: 'text-generation',
    pricing: 'freemium',
    rating: 4.4,
    reviews: 18920,
    tags: ['writing', 'grammar', 'editing', 'productivity'],
    image: 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=400',
    url: 'https://grammarly.com',
    featured: false,
    verified: true,
    addedDate: '2023-01-20',
    lastUpdated: '2024-01-12'
  }
];

export const categories: Category[] = [
  {
    id: 'text-generation',
    name: 'Text Generation',
    icon: 'FileText',
    count: 124,
    color: 'bg-blue-500'
  },
  {
    id: 'image-generation',
    name: 'Image Generation',
    icon: 'Image',
    count: 89,
    color: 'bg-purple-500'
  },
  {
    id: 'developer-tools',
    name: 'Developer Tools',
    icon: 'Code',
    count: 67,
    color: 'bg-green-500'
  },
  {
    id: 'productivity',
    name: 'Productivity',
    icon: 'Zap',
    count: 156,
    color: 'bg-orange-500'
  },
  {
    id: 'video-editing',
    name: 'Video Editing',
    icon: 'Video',
    count: 43,
    color: 'bg-red-500'
  },
  {
    id: 'audio-tools',
    name: 'Audio Tools',
    icon: 'Music',
    count: 38,
    color: 'bg-pink-500'
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    icon: 'BarChart',
    count: 92,
    color: 'bg-teal-500'
  },
  {
    id: 'design-tools',
    name: 'Design Tools',
    icon: 'Palette',
    count: 76,
    color: 'bg-indigo-500'
  }
];