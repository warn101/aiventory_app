import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, loading, initialized, signIn, signUp } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: ''
  });
  
  // Ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Reset mounted ref when modal opens
  useEffect(() => {
    if (isOpen) {
      isMountedRef.current = true;
    }
  }, [isOpen]);

  // Auto-close modal when user is authenticated
  useEffect(() => {
    if (user && isOpen && !isSubmitting && initialized) {
      console.log('AuthModal: User authenticated, auto-closing modal');
      onClose();
    }
  }, [user, isOpen, isSubmitting, onClose, initialized]);

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const validateName = (name: string): string | undefined => {
    if (!isLogin && !name) return 'Name is required';
    if (!isLogin && name.length < 2) return 'Name must be at least 2 characters';
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    if (!isLogin) {
      newErrors.name = validateName(formData.name);
    }
    
    // Remove undefined errors
    Object.keys(newErrors).forEach(key => {
      const errorValue = newErrors[key as keyof ValidationErrors];
      if (!errorValue || errorValue === undefined) {
        delete newErrors[key as keyof ValidationErrors];
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      toast.error('Please wait, processing your request...');
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      if (isLogin) {
        const loadingToast = toast.loading('Signing you in...');
        
        const { error } = await signIn(formData.email, formData.password);
        
        toast.dismiss(loadingToast);
        
        if (!isMountedRef.current) return;
        
        if (error) {
          // Provide specific error messages for common issues
          let errorMessage = error.message || 'Failed to sign in';
          
          if (error.message?.toLowerCase().includes('email not confirmed')) {
            errorMessage = 'Please check your email and click the confirmation link before signing in.';
            toast.error(errorMessage, { duration: 6000 });
          } else if (error.message?.toLowerCase().includes('invalid') && error.message?.toLowerCase().includes('credentials')) {
            errorMessage = 'Invalid email or password. Please check your credentials.';
            toast.error(errorMessage);
            setErrors({ email: ' ', password: ' ' }); // Show field errors without text
          } else if (error.message?.toLowerCase().includes('too many requests')) {
            errorMessage = 'Too many sign-in attempts. Please wait a moment and try again.';
            toast.error(errorMessage);
          } else {
            toast.error(errorMessage);
            setErrors({ email: ' ', password: ' ' }); // Show field errors without text
          }
        } else {
          toast.success('Welcome back!');
          handleClose();
        }
      } else {
        const loadingToast = toast.loading('Creating your account...');
        
        const { error } = await signUp(formData.email, formData.password, { name: formData.name });
        
        toast.dismiss(loadingToast);
        
        if (!isMountedRef.current) return;
        
        if (error) {
          let errorMessage = error.message || 'Failed to create account';
          
          if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already exists')) {
            errorMessage = 'This email is already registered. Try signing in instead.';
            toast.error(errorMessage);
            setErrors({ email: ' ' });
          } else if (error.message?.toLowerCase().includes('password')) {
            errorMessage = 'Password is too weak. Please use at least 6 characters.';
            toast.error(errorMessage);
            setErrors({ password: ' ' });
          } else if (error.message?.toLowerCase().includes('email')) {
            errorMessage = 'Please enter a valid email address.';
            toast.error(errorMessage);
            setErrors({ email: ' ' });
          } else {
            toast.error(errorMessage);
          }
        } else {
          toast.success('Account created! Please check your email to confirm your account.', { duration: 6000 });
          setUserEmail(formData.email);
          setShowConfirmation(true);
          setFormData({ name: '', email: '', password: '' });
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      console.error('Auth error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleClose = () => {
    // Prevent closing if currently submitting
    if (isSubmitting) {
      toast.error('Please wait for the current operation to complete');
      return;
    }
    
    isMountedRef.current = false;
    onClose();
    
    // Reset all state
    setTimeout(() => {
      setFormData({ name: '', email: '', password: '' });
      setErrors({});
      setIsLogin(true);
      setShowConfirmation(false);
      setUserEmail('');
      setShowPassword(false);
      setIsSubmitting(false);
      isMountedRef.current = true;
    }, 300); // Small delay to allow modal animation
  };
  
  const handleModeSwitch = () => {
    if (isSubmitting) {
      toast.error('Please wait for the current operation to complete');
      return;
    }
    
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {showConfirmation ? 'Check Your Email' : (isLogin ? 'Welcome Back' : 'Join AIventory')}
              </h2>
              <p className="text-gray-600">
                {showConfirmation
                  ? `We've sent a confirmation link to ${userEmail}. Please check your email and click the link to activate your account.`
                  : (isLogin 
                    ? 'Sign in to access your personalized AI tool collection'
                    : 'Create an account to start discovering and saving AI tools'
                  )
                }
              </p>
            </div>

            {showConfirmation ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                  <Mail className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-sm text-green-700 mb-4">
                    Please check your email inbox and spam folder. Click the confirmation link to complete your registration.
                  </p>
                  <p className="text-xs text-green-600">
                    Didn't receive the email? Check your spam folder or try signing up again.
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowConfirmation(false);
                      setIsLogin(false);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Sign Up Again
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowConfirmation(false);
                      setIsLogin(true);
                    }}
                    className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                  >
                    Sign In Instead
                  </motion.button>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                          errors.name ? 'text-red-400' : 'text-gray-400'
                        }`} />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 transition-colors ${
                            errors.name 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          placeholder="Enter your full name"
                          required={!isLogin}
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-600 flex items-center"
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.name}
                        </motion.p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                        errors.email ? 'text-red-400' : 'text-gray-400'
                      }`} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 transition-colors ${
                          errors.email 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        placeholder="Enter your email"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-sm text-red-600 flex items-center"
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.email}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                        errors.password ? 'text-red-400' : 'text-gray-400'
                      }`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 transition-colors ${
                          errors.password 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        placeholder="Enter your password"
                        required
                        disabled={isSubmitting}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-sm text-red-600 flex items-center"
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800'
                    } text-white disabled:opacity-50`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                      </div>
                    ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-gray-600">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                      onClick={handleModeSwitch}
                      className="ml-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </div>
              </>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-500">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;