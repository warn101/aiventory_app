import { Tool, User, Review } from '../types';
import { Database } from '../types/database';

type DatabaseReview = Database['public']['Tables']['reviews']['Row'];

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bookmarks: string[];
  reviews: DatabaseReview[];
}

type BookmarkData = Database['public']['Tables']['bookmarks']['Row'];
type ReviewData = Database['public']['Tables']['reviews']['Row'];

export interface BookmarkSuggestion {
  shouldSuggest: boolean;
  message: string;
  confidence: number; // 0-1 scale
  reasons: string[];
}

export interface UserInterestHistory {
  bookmarkedTools: Tool[];
  reviewedTools: Tool[];
  preferredCategories: string[];
  preferredTags: string[];
  averageRatingGiven: number;
  pricingPreference: ('free' | 'freemium' | 'paid')[];
}

/**
 * Analyzes user interest history from bookmarks and reviews
 */
export function analyzeUserInterests(bookmarkedTools: Tool[], reviewedTools: Tool[]): UserInterestHistory {
  const allInteractedTools = [...bookmarkedTools, ...reviewedTools];
  
  // Extract preferred categories
  const categoryCount = allInteractedTools.reduce((acc, tool) => {
    acc[tool.category] = (acc[tool.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const preferredCategories = Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);
  
  // Extract preferred tags
  const tagCount = allInteractedTools.reduce((acc, tool) => {
    tool.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const preferredTags = Object.entries(tagCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);
  
  // Calculate average rating given (from reviews)
  const averageRatingGiven = reviewedTools.length > 0 
    ? reviewedTools.reduce((sum, tool) => sum + tool.rating, 0) / reviewedTools.length
    : 4.0; // Default neutral rating
  
  // Extract pricing preferences
  const pricingCount = allInteractedTools.reduce((acc, tool) => {
    acc[tool.pricing] = (acc[tool.pricing] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const pricingPreference = Object.entries(pricingCount)
    .sort(([,a], [,b]) => b - a)
    .map(([pricing]) => pricing as 'free' | 'freemium' | 'paid');
  
  return {
    bookmarkedTools,
    reviewedTools,
    preferredCategories,
    preferredTags,
    averageRatingGiven,
    pricingPreference
  };
}

/**
 * Calculates similarity score between two tools based on tags and category
 */
function calculateToolSimilarity(tool1: Tool, tool2: Tool): number {
  let score = 0;
  
  // Category match (high weight)
  if (tool1.category === tool2.category) {
    score += 0.4;
  }
  
  // Tag overlap (medium weight)
  const commonTags = tool1.tags.filter(tag => tool2.tags.includes(tag));
  const tagSimilarity = commonTags.length / Math.max(tool1.tags.length, tool2.tags.length);
  score += tagSimilarity * 0.3;
  
  // Pricing similarity (low weight)
  if (tool1.pricing === tool2.pricing) {
    score += 0.1;
  }
  
  // Rating similarity (low weight)
  const ratingDiff = Math.abs(tool1.rating - tool2.rating);
  const ratingSimilarity = Math.max(0, 1 - ratingDiff / 5);
  score += ratingSimilarity * 0.2;
  
  return Math.min(score, 1);
}

/**
 * Checks if a tool is trending based on recent activity
 */
function isToolTrending(tool: Tool): boolean {
  // Simple heuristic: high rating with good review count
  return tool.rating >= 4.2 && tool.reviews >= 100;
}

/**
 * Main function to suggest whether user should bookmark a tool
 */
export function suggestBookmark(
  tool: Tool,
  userInterests: UserInterestHistory,
  isAlreadyBookmarked: boolean = false
): BookmarkSuggestion {
  if (isAlreadyBookmarked) {
    return {
      shouldSuggest: false,
      message: "You've already bookmarked this tool!",
      confidence: 0,
      reasons: []
    };
  }
  
  const reasons: string[] = [];
  let confidence = 0;
  
  // Check category preference
  if (userInterests.preferredCategories.includes(tool.category)) {
    const categoryRank = userInterests.preferredCategories.indexOf(tool.category) + 1;
    reasons.push(`Matches your #${categoryRank} favorite category: ${tool.category}`);
    confidence += 0.3 - (categoryRank - 1) * 0.1; // Higher score for top categories
  }
  
  // Check tag overlap
  const matchingTags = tool.tags.filter(tag => userInterests.preferredTags.includes(tag));
  if (matchingTags.length > 0) {
    reasons.push(`Similar to tools you like: ${matchingTags.slice(0, 2).join(', ')}`);
    confidence += Math.min(matchingTags.length * 0.1, 0.25);
  }
  
  // Check similarity to bookmarked tools
  const similarTools = userInterests.bookmarkedTools
    .map(bookmarkedTool => ({
      tool: bookmarkedTool,
      similarity: calculateToolSimilarity(tool, bookmarkedTool)
    }))
    .filter(({ similarity }) => similarity > 0.6)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 2);
  
  if (similarTools.length > 0) {
    const mostSimilar = similarTools[0];
    reasons.push(`Similar to ${mostSimilar.tool.name} which you bookmarked`);
    confidence += mostSimilar.similarity * 0.2;
  }
  
  // Check pricing preference
  if (userInterests.pricingPreference.includes(tool.pricing)) {
    const pricingRank = userInterests.pricingPreference.indexOf(tool.pricing) + 1;
    if (pricingRank <= 2) {
      reasons.push(`Matches your pricing preference: ${tool.pricing}`);
      confidence += 0.1;
    }
  }
  
  // Check if tool is trending
  if (isToolTrending(tool)) {
    reasons.push('This tool is trending with high ratings!');
    confidence += 0.15;
  }
  
  // Check if tool has high rating
  if (tool.rating >= 4.5) {
    reasons.push(`Highly rated (${tool.rating}/5) by the community`);
    confidence += 0.1;
  }
  
  // Determine if we should suggest
  const shouldSuggest = confidence >= 0.4 && reasons.length >= 2;
  
  // Generate friendly message
  let message = '';
  if (shouldSuggest) {
    const primaryReason = reasons[0];
    if (primaryReason.includes('Similar to')) {
      message = `💡 You might love this! ${primaryReason}.`;
    } else if (primaryReason.includes('category')) {
      message = `🎯 Perfect match! ${primaryReason}.`;
    } else if (primaryReason.includes('trending')) {
      message = `🔥 ${primaryReason} Don't miss out!`;
    } else {
      message = `⭐ Great choice! ${primaryReason}.`;
    }
  }
  
  return {
    shouldSuggest,
    message,
    confidence: Math.min(confidence, 1),
    reasons
  };
}

// Helper function to convert database reviews to Review type
const convertDatabaseReview = (dbReview: DatabaseReview): Review => ({
  id: dbReview.id,
  toolId: dbReview.tool_id,
  userId: dbReview.user_id,
  rating: dbReview.rating,
  comment: dbReview.comment,
  date: dbReview.created_at,
  helpful: dbReview.helpful_count
});

/**
 * Helper function to get bookmark suggestion for a tool given user data
 */
export async function getBookmarkSuggestionForUser(
  tool: Tool,
  user: AuthUser | null,
  bookmarkedTools: Tool[] = [],
  reviewedTools: Tool[] = []
): Promise<BookmarkSuggestion> {
  if (!user) {
    return {
      shouldSuggest: false,
      message: 'Sign in to get personalized recommendations!',
      confidence: 0,
      reasons: []
    };
  }
  
  const isAlreadyBookmarked = user.bookmarks.includes(tool.id);
  const userInterests = analyzeUserInterests(bookmarkedTools, reviewedTools);
  
  return suggestBookmark(tool, userInterests, isAlreadyBookmarked);
}