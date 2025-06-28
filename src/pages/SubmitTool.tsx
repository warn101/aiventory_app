import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Upload, 
  Link as LinkIcon, 
  Tag, 
  DollarSign, 
  FileText,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface SubmitToolProps {
  onSubmit: (data: any) => void;
  user?: any;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  pricing: 'free' | 'freemium' | 'paid';
  url: string;
  tags: string[];
  features: string[];
  contactEmail: string;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  category?: string;
  url?: string;
  contactEmail?: string;
}

const SubmitTool: React.FC<SubmitToolProps> = ({ onSubmit, user }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: '',
    pricing: 'free',
    url: '',
    tags: [],
    features: [],
    contactEmail: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');

  const categories = [
    { value: 'text-generation', label: 'Text Generation' },
    { value: 'image-generation', label: 'Image Generation' },
    { value: 'developer-tools', label: 'Developer Tools' },
    { value: 'productivity', label: 'Productivity' },
    { value: 'video-editing', label: 'Video Editing' },
    { value: 'audio-tools', label: 'Audio Tools' },
    { value: 'data-analysis', label: 'Data Analysis' },
    { value: 'design-tools', label: 'Design Tools' }
  ];

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Tell us about your tool', icon: FileText },
    { id: 2, title: 'Details & Features', description: 'Add more details', icon: Tag },
    { id: 3, title: 'Review & Submit', description: 'Review your submission', icon: Check }
  ];

  // Validation functions
  const validateStep1 = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tool name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Tool name must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'Website URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }
    
    return newErrors;
  };

  const validateStep2 = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    
    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      if (formData.tags.length >= 10) {
        toast.error('Maximum 10 tags allowed');
        return;
      }
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
      toast.success('Tag added!');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addFeature = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      if (formData.features.length >= 10) {
        toast.error('Maximum 10 features allowed');
        return;
      }
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
      toast.success('Feature added!');
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(feature => feature !== featureToRemove)
    }));
  };

  const nextStep = () => {
    let stepErrors: ValidationErrors = {};
    
    if (currentStep === 1) {
      stepErrors = validateStep1();
    } else if (currentStep === 2) {
      stepErrors = validateStep2();
    }
    
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error('Please fix the errors before continuing');
      return;
    }
    
    setErrors({});
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      toast.success(`Step ${currentStep + 1} completed!`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to submit a tool');
      return;
    }

    // Final validation
    const step1Errors = validateStep1();
    const step2Errors = validateStep2();
    const allErrors = { ...step1Errors, ...step2Errors };
    
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      toast.error('Please fix all errors before submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Transform form data to match database schema
      const toolData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        pricing: formData.pricing,
        website_url: formData.url.trim(),
        tags: [...formData.tags, ...formData.features],
        rating: 0,
        reviews_count: 0,
        featured: false,
        verified: false
      };
      
      console.log('Submitting tool data:', toolData);
      
      // Call the onSubmit prop
      await onSubmit(toolData);
      
      // Show success message
      toast.success('🎉 Tool submitted successfully! We\'ll review it within 2-3 business days.', {
        duration: 5000,
      });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        pricing: 'free',
        url: '',
        tags: [],
        features: [],
        contactEmail: ''
      });
      setCurrentStep(1);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit tool. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Submit Your AI Tool</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Share your AI tool with the community and help others discover innovative solutions
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center space-x-3 ${index < steps.length - 1 ? 'pr-8' : ''}`}>
                    <motion.div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                        currentStep >= step.id 
                          ? 'bg-primary-600 text-white shadow-lg' 
                          : 'bg-gray-200 text-gray-600'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </motion.div>
                    <div className="text-left">
                      <div className={`font-medium transition-colors ${
                        currentStep >= step.id ? 'text-primary-600' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-sm text-gray-500">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <motion.div 
                      className={`w-16 h-0.5 transition-colors duration-300 ${
                        currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: currentStep > step.id ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Authentication Status */}
          <motion.div 
            className={`mb-6 p-4 border rounded-lg ${
              user ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className={`flex items-center space-x-2 ${
              user ? 'text-green-700' : 'text-red-700'
            }`}>
              {user ? (
                <><Check className="h-5 w-5" /> <span>Signed in - Ready to submit</span></>
              ) : (
                <><AlertCircle className="h-5 w-5" /> <span>Please sign in to submit a tool</span></>
              )}
            </p>
          </motion.div>

          {/* Form Steps */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tool Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your tool's name"
                    />
                    {errors.name && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-sm mt-1"
                      >
                        {errors.name}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                        errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Describe what your tool does and its key benefits"
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.description ? (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-600 text-sm"
                        >
                          {errors.description}
                        </motion.p>
                      ) : (
                        <span></span>
                      )}
                      <span className={`text-sm ${
                        formData.description.length < 20 ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {formData.description.length}/20 min
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                          errors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-600 text-sm mt-1"
                        >
                          {errors.category}
                        </motion.p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pricing Model *
                      </label>
                      <select
                        name="pricing"
                        value={formData.pricing}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      >
                        <option value="free">Free</option>
                        <option value="freemium">Freemium</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website URL *
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="url"
                        name="url"
                        value={formData.url}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                          errors.url ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="https://your-tool.com"
                      />
                    </div>
                    {errors.url && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-sm mt-1"
                      >
                        {errors.url}
                      </motion.p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Details & Features */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (Optional)
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Add a tag and press Enter"
                        maxLength={30}
                      />
                      <motion.button
                        type="button"
                        onClick={addTag}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Add
                      </motion.button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AnimatePresence>
                        {formData.tags.map((tag, index) => (
                          <motion.span
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 text-primary-500 hover:text-primary-700 transition-colors"
                            >
                              ×
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.tags.length}/10 tags
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Features (Optional)
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addFeature();
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Add a feature and press Enter"
                        maxLength={100}
                      />
                      <motion.button
                        type="button"
                        onClick={addFeature}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        Add
                      </motion.button>
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {formData.features.map((feature, index) => (
                          <motion.div
                            key={feature}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-gray-900">{feature}</span>
                            <button
                              type="button"
                              onClick={() => removeFeature(feature)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              Remove
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.features.length}/10 features
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                        errors.contactEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.contactEmail ? (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-sm mt-1"
                      >
                        {errors.contactEmail}
                      </motion.p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">
                        We'll use this to contact you about your submission
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <motion.div 
                    className="bg-blue-50 border border-blue-200 rounded-lg p-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-2">Review Your Submission</h3>
                        <p className="text-blue-800">
                          Please review all the information below before submitting. Our team will review your submission and get back to you within 2-3 business days.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tool Name</label>
                        <p className="text-gray-900 font-medium">{formData.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Category</label>
                        <p className="text-gray-900 capitalize">{formData.category.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Pricing</label>
                        <p className="text-gray-900 capitalize">{formData.pricing}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Website</label>
                        <p className="text-gray-900 break-all">{formData.url}</p>
                      </div>
                      {formData.contactEmail && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Contact Email</label>
                          <p className="text-gray-900">{formData.contactEmail}</p>
                        </div>
                      )}
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-gray-900">{formData.description}</p>
                      </div>
                      {formData.tags.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Tags</label>
                          <div className="flex flex-wrap gap-1">
                            {formData.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {formData.features.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Features</label>
                          <ul className="text-gray-900 text-sm space-y-1">
                            {formData.features.map((feature, index) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <motion.div 
            className="flex justify-between pt-8 border-t border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              whileHover={{ scale: currentStep === 1 ? 1 : 1.05 }}
              whileTap={{ scale: currentStep === 1 ? 1 : 0.95 }}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </motion.button>
            
            {currentStep < 3 ? (
              <motion.button
                type="button"
                onClick={nextStep}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={handleFinalSubmit}
                disabled={!user || isSubmitting}
                whileHover={{ scale: !user || isSubmitting ? 1 : 1.05 }}
                whileTap={{ scale: !user || isSubmitting ? 1 : 0.95 }}
                className={`flex items-center space-x-2 px-8 py-3 rounded-lg transition-colors font-medium ${
                  !user
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : isSubmitting
                    ? 'bg-primary-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : !user ? (
                  <span>Sign In Required</span>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span>Submit Tool</span>
                  </>
                )}
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SubmitTool;