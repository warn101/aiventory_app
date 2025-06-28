import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Mail, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailConfirmationProps {
  token?: string;
  onComplete?: () => void;
}

const EmailConfirmation: React.FC<EmailConfirmationProps> = ({ token, onComplete }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleConfirmation = async () => {
      if (!token) {
        setStatus('error');
        setError('Invalid confirmation link');
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });
        
        if (error) {
          setStatus('error');
          setError(error.message || 'Failed to confirm email');
        } else {
          setStatus('success');
          // Auto-close after 3 seconds
          setTimeout(() => {
            onComplete?.();
          }, 3000);
        }
      } catch (err) {
        setStatus('error');
        setError('An unexpected error occurred');
      }
    };

    handleConfirmation();
  }, [token, onComplete]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="h-16 w-16 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-600" />;
      default:
        return <Mail className="h-16 w-16 text-gray-400" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Confirming Your Email...';
      case 'success':
        return 'Email Confirmed!';
      case 'error':
        return 'Confirmation Failed';
      default:
        return 'Email Confirmation';
    }
  };

  const getMessage = () => {
    switch (status) {
      case 'loading':
        return 'Please wait while we confirm your email address.';
      case 'success':
        return 'Your email has been successfully confirmed. You can now sign in to your account.';
      case 'error':
        return error || 'There was an error confirming your email. Please try again or contact support.';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          {getIcon()}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          {getTitle()}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6"
        >
          {getMessage()}
        </motion.p>

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-green-600"
          >
            Redirecting in 3 seconds...
          </motion.div>
        )}

        {status === 'error' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onComplete}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Continue
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default EmailConfirmation;