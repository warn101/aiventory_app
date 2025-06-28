export interface Database {
  public: {
    Tables: {
      tools: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          pricing: 'free' | 'freemium' | 'paid';
          rating: number;
          reviews_count: number;
          tags: string[];
          website_url: string;
          featured: boolean;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          category: string;
          pricing: 'free' | 'freemium' | 'paid';
          rating?: number;
          reviews_count?: number;
          tags: string[];
          website_url: string;
          featured?: boolean;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: string;
          pricing?: 'free' | 'freemium' | 'paid';
          rating?: number;
          reviews_count?: number;
          tags?: string[];
          website_url?: string;
          featured?: boolean;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          color: string;
          tools_count: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          icon: string;
          color: string;
          tools_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string;
          color?: string;
          tools_count?: number;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tool_id?: string;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          rating: number;
          comment: string;
          helpful_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_id: string;
          rating: number;
          comment: string;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tool_id?: string;
          rating?: number;
          comment?: string;
          helpful_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      pricing_type: 'free' | 'freemium' | 'paid';
    };
  };
}