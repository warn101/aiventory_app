import { useState } from 'react';
import { uploadToSupabaseStorage, deleteFromSupabaseStorage } from '../lib/supabaseStorage';

type BucketType = 'avatars' | 'tools';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (
    file: File, 
    bucket: BucketType = 'tools',
    folder?: string
  ): Promise<string | null> => {
    if (!file) {
      setError('No file selected');
      return null;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return null;
    }

    try {
      setUploading(true);
      setError(null);

      const result = await uploadToSupabaseStorage(file, bucket, folder);
      return result.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (
    bucket: BucketType,
    filePath: string
  ): Promise<boolean> => {
    try {
      setError(null);
      return await deleteFromSupabaseStorage(bucket, filePath);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete image';
      setError(errorMessage);
      return false;
    }
  };

  const clearError = () => setError(null);

  return {
    uploadImage,
    deleteImage,
    uploading,
    error,
    clearError
  };
};