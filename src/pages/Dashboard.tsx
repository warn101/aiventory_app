import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bookmark, 
  Star, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Heart,
  MessageCircle,
  Filter,
  Search,
  Grid,
  List
} from 'lucide-react';
import { User, Tool } from '../types';
import ToolCard from '../components/ToolCard';

interface DashboardProps {
  user: User;
  tools: Tool[];
  onToolClick: (toolId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, tools, onToolClick }) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'reviews' | 'activity'>('bookmarks');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for demo
  const bookmarkedTools = tools.slice(0, 4);
  const recentActivity = [
    { type: 'bookmark', tool: 'ChatGPT', date: '2024-01-15' },
    { type: 'review', tool: 'Midjourney', date: '2024-01-14' },
    { type: 'like', tool: 'GitHub Copilot', date: '2024-01-13' },
  ];

  const stats = [
    { label: 'Bookmarked Tools', value: '24', icon: Bookmark, color: 'text-blue-600' },
    { label: 'Reviews Written', value: '8', icon: MessageCircle, color: 'text-green-600' },
    { label: 'Tools Liked', value: '156', icon: Heart, color: 'text-red-600' },
    { label: 'Days Active', value: '45', icon: Calendar, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
              <p className="text-gray-600">Manage your AI tool collection and activity</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'bookmarks', label: 'Bookmarked Tools', icon: Bookmark },
                { id: 'reviews', label: 'My Reviews', icon: MessageCircle },
                { id: 'activity', label: 'Recent Activity', icon: TrendingUp },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary-500 text-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'bookmarks' && (
              <div>
                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search bookmarked tools..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Filter className="h-4 w-4" />
                      <span>Filter</span>
                    </button>
                    
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        <Grid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bookmarked Tools */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarkedTools.map((tool, index) => (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ToolCard tool={tool} onToolClick={onToolClick} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookmarkedTools.map((tool, index) => (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => onToolClick(tool.id)}
                      >
                        <img
                          src={tool.image}
                          alt={tool.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                          <p className="text-gray-600 text-sm line-clamp-1">{tool.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span>{tool.rating}</span>
                            </div>
                            <span className="capitalize">{tool.pricing}</span>
                          </div>
                        </div>
                        <Bookmark className="h-5 w-5 text-primary-600 fill-current" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Reviews</h3>
                <p className="text-gray-600">Reviews you've written will appear here.</p>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className={`p-2 rounded-full ${
                      activity.type === 'bookmark' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'review' ? 'bg-green-100 text-green-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {activity.type === 'bookmark' && <Bookmark className="h-4 w-4" />}
                      {activity.type === 'review' && <MessageCircle className="h-4 w-4" />}
                      {activity.type === 'like' && <Heart className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">
                        You {activity.type === 'bookmark' ? 'bookmarked' : activity.type === 'review' ? 'reviewed' : 'liked'} <span className="font-semibold">{activity.tool}</span>
                      </p>
                      <p className="text-sm text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;