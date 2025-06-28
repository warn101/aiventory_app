import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  ExternalLink, 
  Bookmark, 
  Share2, 
  Shield, 
  Sparkles,
  Calendar,
  Globe,
  DollarSign,
  Users,
  MessageCircle,
  ThumbsUp,
  Flag
} from 'lucide-react';
import { Tool, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useBookmarkContext } from '../contexts/BookmarkContext';
import { ReviewForm } from '../components/ReviewForm';
import { ReviewList } from '../components/ReviewList';
import { ReviewSummary } from '../components/ReviewSummary';
import { LikeButton, LikeCount } from '../components/LikeButton';


interface ToolDetailProps {
  tool: Tool;
  onBack: () => void;
  currentUser: User | null;
}

const ToolDetail: React.FC<ToolDetailProps> = ({ tool, onBack, currentUser }) => {
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarkContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'alternatives'>('overview');
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const toolIsBookmarked = isBookmarked(tool.id);

  const getPricingBadge = (pricing: string) => {
    const styles = {
      free: 'bg-green-100 text-green-800 border-green-200',
      freemium: 'bg-blue-100 text-blue-800 border-blue-200',
      paid: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return styles[pricing as keyof typeof styles] || styles.free;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Tools</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Hero Image */}
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
                <img
                  src={tool.image}
                  alt={tool.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Badges */}
                <div className="absolute top-6 left-6 flex flex-col space-y-2">
                  {tool.featured && (
                    <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200">
                      <Sparkles className="h-4 w-4" />
                      <span>Featured</span>
                    </div>
                  )}
                  {tool.verified && (
                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                      <Shield className="h-4 w-4" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="absolute top-6 right-6 flex space-x-2">
                  {user && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        setBookmarkLoading(true);
                        await toggleBookmark(tool.id);
                        setBookmarkLoading(false);
                      }}
                      disabled={bookmarkLoading}
                      className={`p-3 rounded-full backdrop-blur-md border transition-colors ${
                        toolIsBookmarked 
                          ? 'bg-primary-600 text-white border-primary-600' 
                          : 'bg-white/80 text-gray-600 border-white/20 hover:bg-white'
                      } ${bookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Bookmark className="h-5 w-5" fill={toolIsBookmarked ? 'currentColor' : 'none'} />
                    </motion.button>
                  )}
                  <LikeButton 
                    toolId={tool.id}
                    size="md"
                    variant="default"
                    className="backdrop-blur-md"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 rounded-full bg-white/80 text-gray-600 border border-white/20 backdrop-blur-md hover:bg-white transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">{tool.name}</h1>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <ReviewSummary 
                        toolId={tool.id} 
                        variant="default" 
                        showReviewCount={true}
                      />
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPricingBadge(tool.pricing || 'free')}`}>
                        {(tool.pricing || 'free').charAt(0).toUpperCase() + (tool.pricing || 'free').slice(1)}
                      </span>
                      <LikeCount toolId={tool.id} />
                    </div>
                  </div>
                  
                  <motion.a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors font-semibold"
                  >
                    <span>Try Now</span>
                    <ExternalLink className="h-5 w-5" />
                  </motion.a>
                </div>

                <p className="text-lg text-gray-700 leading-relaxed mb-8">
                  {tool.description}
                </p>



                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {tool.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg font-medium hover:bg-primary-200 transition-colors cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-8">
                  <nav className="flex space-x-8">
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'reviews', label: 'Reviews' },
                      { id: 'alternatives', label: 'Alternatives' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">About {tool.name}</h3>
                        <p className="text-gray-700 leading-relaxed">
                          This is a comprehensive AI tool that provides advanced capabilities for various use cases. 
                          It offers a user-friendly interface combined with powerful features that make it suitable 
                          for both beginners and professionals.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h3>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                            <span>Advanced AI-powered functionality</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                            <span>Intuitive user interface</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                            <span>Integration capabilities</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></span>
                            <span>Regular updates and improvements</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-6">
                      {/* Review Summary */}
                      <ReviewSummary 
                        toolId={tool.id} 
                        variant="detailed" 
                        showReviewCount={true}
                      />
                      
                      {/* Review Form */}
                      <ReviewForm 
                        toolId={tool.id}
                        onSuccess={() => {
                          // Optionally show success message or refresh reviews
                        }}
                      />

                      {/* Reviews List */}
                      <ReviewList 
                        toolId={tool.id}
                        showTitle={false}
                      />
                    </div>
                  )}

                  {activeTab === 'alternatives' && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🔄</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Alternative Tools</h3>
                      <p className="text-gray-600">Similar tools and alternatives will be displayed here.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tool Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tool Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Added</div>
                    <div className="font-medium">{new Date(tool.addedDate).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Website</div>
                    <a href={tool.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 hover:text-primary-700">
                      Visit Tool
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Pricing</div>
                    <div className="font-medium capitalize">{tool.pricing}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Engagement</div>
                    <div className="space-y-1">
                      <ReviewSummary 
                        toolId={tool.id} 
                        variant="compact" 
                        showReviewCount={true}
                      />
                      <LikeCount toolId={tool.id} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Related Tools */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Tools</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Related Tool {i}</div>
                      <div className="text-sm text-gray-500">Similar functionality</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolDetail;