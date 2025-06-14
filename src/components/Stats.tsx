import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Users, Star, Zap } from 'lucide-react';

const Stats: React.FC = () => {
  const stats = [
    {
      icon: Brain,
      value: '2,500+',
      label: 'AI Tools',
      color: 'text-primary-600'
    },
    {
      icon: Users,
      value: '50K+',
      label: 'Active Users',
      color: 'text-accent-600'
    },
    {
      icon: Star,
      value: '95K+',
      label: 'Reviews',
      color: 'text-yellow-600'
    },
    {
      icon: Zap,
      value: '100+',
      label: 'New Tools/Week',
      color: 'text-green-600'
    }
  ];

  return (
    <section className="py-16 px-4 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 ${stat.color} mb-4`}>
                <stat.icon className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;