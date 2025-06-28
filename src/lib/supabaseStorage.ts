// Supabase Storage integration for image uploads
// This replaces Cloudinary functionality with Supabase Storage

import { supabase } from './supabase';

interface SupabaseUploadResponse {
  url: string;
  path: string;
}

/**
 * Upload an image file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name ('avatars' or 'tools')
 * @param folder - Optional folder path within the bucket
 * @returns Promise with the uploaded file URL and path
 */
export const uploadToSupabaseStorage = async (
  file: File,
  bucket: 'avatars' | 'tools',
  folder?: string
): Promise<SupabaseUploadResponse> => {
  try {
    // Step 1: Validate current session first
    console.log('🔍 Storage: Validating session before upload...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ Storage: No valid session found');
      throw new Error('Authentication required. Please sign in again.');
    }

    // Step 2: Check if session is expired and refresh if needed
    if (session.expires_at && Date.now() / 1000 > session.expires_at) {
      console.log('🔄 Storage: Session expired, attempting refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        console.error('❌ Storage: Session refresh failed');
        throw new Error('Session expired. Please sign in again.');
      }
      console.log('✅ Storage: Session refreshed successfully');
    }

    // Step 3: Validate file type
    const allowedTypes = {
      avatars: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
      tools: ['image/png', 'image/jpeg', 'image/webp']
    };

    if (!allowedTypes[bucket].includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types for ${bucket}: ${allowedTypes[bucket].join(', ')}`);
    }

    // Step 4: Validate file size
    const maxSizes = {
      avatars: 5 * 1024 * 1024, // 5MB
      tools: 10 * 1024 * 1024   // 10MB
    };

    if (file.size > maxSizes[bucket]) {
      throw new Error(`File too large. Maximum size for ${bucket}: ${maxSizes[bucket] / (1024 * 1024)}MB`);
    }

    // Step 5: Get current user with additional validation
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Storage: User authentication failed:', userError);
      throw new Error('User authentication failed. Please sign in again.');
    }
    
    console.log('✅ Storage: User authenticated, proceeding with upload...');

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}_${randomString}.${fileExt}`;

    // Construct file path
    const basePath = folder ? `${user.id}/${folder}` : user.id;
    const filePath = `${basePath}/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error instanceof Error ? error : new Error('Failed to upload file');
  }
};

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param filePath - The path of the file to delete
 * @returns Promise<boolean> - Success status
 */
export const deleteFromSupabaseStorage = async (
  bucket: 'avatars' | 'tools',
  filePath: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Supabase Storage delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

/**
 * Get a signed URL for a private file (if needed in the future)
 * @param bucket - The storage bucket name
 * @param filePath - The path of the file
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise<string> - Signed URL
 */
export const getSignedUrl = async (
  bucket: 'avatars' | 'tools',
  filePath: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    throw error instanceof Error ? error : new Error('Failed to create signed URL');
  }
};

/**
 * List files in a user's folder
 * @param bucket - The storage bucket name
 * @param folder - Optional folder path
 * @returns Promise with list of files
 */
export const listUserFiles = async (
  bucket: 'avatars' | 'tools',
  folder?: string
) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User must be authenticated to list files');
    }

    const path = folder ? `${user.id}/${folder}` : user.id;

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('List files error:', error);
    throw error instanceof Error ? error : new Error('Failed to list files');
  }
};