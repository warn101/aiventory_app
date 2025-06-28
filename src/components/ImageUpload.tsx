import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { useImageUpload } from '../hooks/useImageUpload';
import { useAuthContext } from '../contexts/AuthContext';

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  currentImage?: string;
  className?: string;
  bucket?: 'avatars' | 'tools';
  folder?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  currentImage,
  className = '',
  bucket = 'tools',
  folder
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const { uploadImage, uploading, error, clearError } = useImageUpload();
  const { user, loading: authLoading, isAuthenticated, rehydrateSession } = useAuthContext();

  // Ensure session is valid before upload
  const ensureValidSession = async () => {
    if (!isAuthenticated()) {
      await rehydrateSession();
    }
  };
  const [authError, setAuthError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear any previous auth errors
    setAuthError(null);
    clearError();

    // Ensure we have a valid session before upload
    try {
      await ensureValidSession();
    } catch (err) {
      console.error('Session validation failed:', err);
      setAuthError('Authentication session expired. Please sign in again.');
      return;
    }

    // Check if user is authenticated after session validation
    if (!user || !isAuthenticated()) {
      setAuthError('You must be signed in to upload images.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAuthError('Please select a valid image file.');
      return;
    }

    // Validate file size (5MB for avatars, 10MB for tools)
    const maxSize = bucket === 'avatars' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      setAuthError(`File too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      // Upload to Supabase Storage with user-specific path
      const uploadedUrl = await uploadImage(file, bucket, folder);
      
      if (uploadedUrl) {
        onImageUpload(uploadedUrl);
        // Clean up preview URL since we have the real URL now
        URL.revokeObjectURL(previewUrl);
        setPreview(uploadedUrl);
      } else {
        // Reset preview if upload failed
        setPreview(currentImage || null);
        URL.revokeObjectURL(previewUrl);
      }
    } catch (err) {
      // Reset preview on error
      setPreview(currentImage || null);
      URL.revokeObjectURL(previewUrl);
      
      // Set auth error if it's an authentication issue
      if (err instanceof Error && err.message.includes('authenticated')) {
        setAuthError('Authentication expired. Please sign in again.');
      }
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    // Clear any previous errors
    clearError();
    setAuthError(null);
    
    // Check if user is authenticated before allowing file selection
    if (!user) {
      setAuthError('You must be signed in to upload images.');
      return;
    }
    
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClick}
                  disabled={uploading}
                  className="p-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRemoveImage}
                  disabled={uploading}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="flex items-center space-x-2 text-white">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: !uploading && !authLoading && user ? 1.02 : 1 }}
            whileTap={{ scale: !uploading && !authLoading && user ? 0.98 : 1 }}
            onClick={handleClick}
            disabled={uploading || authLoading || !user}
            className={`w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              !user 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
            }`}
          >
            {authLoading ? (
              <div className="flex items-center space-x-2 text-gray-600">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-lg font-medium">Checking authentication...</span>
              </div>
            ) : uploading ? (
              <div className="flex items-center space-x-2 text-primary-600">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-lg font-medium">Uploading...</span>
              </div>
            ) : !user ? (
              <>
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <span className="text-lg font-medium text-red-600">Sign in required</span>
                <span className="text-sm text-red-500 mt-2">You must be signed in to upload images</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
                <span className="text-lg font-medium text-gray-600">Click to upload image</span>
                <span className="text-sm text-gray-500 mt-2">
                  PNG, JPG up to {bucket === 'avatars' ? '5MB' : '10MB'}
                </span>
              </>
            )}
          </motion.button>
        )}
      </div>

      {(error || authError) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{authError || error}</span>
        </motion.div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;