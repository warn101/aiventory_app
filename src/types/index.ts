export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  pricing: 'free' | 'freemium' | 'paid';
  rating: number;
  reviews: number;
  tags: string[];
  image: string;
  url: string;
  featured: boolean;
  verified: boolean;
  addedDate: string;
  lastUpdated: string;
  created_at?: string; // Optional for compatibility
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

export interface FilterState {
  category: string;
  pricing: string;
  rating: number;
  featured: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bookmarks: string[];
  reviews: Review[];
}

export interface Review {
  id: string;
  toolId: string;
  userId: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export interface SubmissionData {
  name: string;
  description: string;
  category: string;
  pricing: 'free' | 'freemium' | 'paid';
  url: string;
  image: string;
  tags: string[];
  features: string[];
  contactEmail: string;
}