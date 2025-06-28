-- Create storage buckets for avatars and tools
-- This migration sets up the necessary storage buckets and policies

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create tools bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tools',
  'tools',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create policies for avatars bucket
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Create policies for tools bucket
-- Allow authenticated users to upload tool images
CREATE POLICY "Authenticated users can upload tool images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tools' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to update tool images they uploaded
CREATE POLICY "Users can update tool images they uploaded" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tools' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to delete tool images they uploaded
CREATE POLICY "Users can delete tool images they uploaded" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tools' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access to tool images
CREATE POLICY "Public can view tool images" ON storage.objects
  FOR SELECT USING (bucket_id = 'tools');