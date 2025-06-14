import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Image, 
  Code, 
  Zap, 
  Video, 
  Music, 
  BarChart, 
  Palette 
} from 'lucide-react';
import { categories } from '../data/mockData';

interface CategoriesProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const Categories: React.FC<CategoriesProps> = ({ selectedCategory, onCategorySelect }) => {
  const iconMap = {
    FileText,
    Image,
    Code,
    Zap,
    Video,
    Music,
    BarChart,
    Palette
  };

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Explore by Category
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover AI tools organized by their primary use cases and applications
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category, index) => {
            const IconComponent = iconMap[category.icon as keyof typeof iconMap];
            
            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCategorySelect(category.id)}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'border-primary-500 bg-primary-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary-600 text-white'
                      : `${category.color} text-white group-hover:scale-110`
                  }`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  <h3 className={`font-semibold text-sm mb-1 transition-colors ${
                    selectedCategory === category.id
                      ? 'text-primary-900'
                      : 'text-gray-900 group-hover:text-primary-600'
                  }`}>
                    {category.name}
                  </h3>
                  
                  <p className={`text-xs transition-colors ${
                    selectedCategory === category.id
                      ? 'text-primary-600'
                      : 'text-gray-500'
                  }`}>
                    {category.count} tools
                  </p>
                </div>

                {/* Selection indicator */}
                {selectedCategory === category.id && (
                  <motion.div
                    layoutId="category-indicator"
                    className="absolute inset-0 bg-primary-600/5 rounded-2xl"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;