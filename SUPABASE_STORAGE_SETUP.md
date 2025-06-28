# Supabase Storage Setup Guide

This guide explains how to set up and use Supabase Storage for image uploads in the AIventory application.

## Prerequisites

- Supabase CLI installed
- Remote Supabase project (supabase.com account)
- Project linked to your Supabase remote instance

## Setup Instructions

### Option 1: Remote Supabase Setup (Recommended for Production)

#### 1. Link to Remote Project

```bash
# Link your local project to remote Supabase
supabase link --project-ref YOUR_PROJECT_REF
```

#### 2. Push Storage Migration to Remote

```bash
# Push the migration to your remote Supabase project
supabase db push
```

#### 3. Verify in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Storage section
3. Verify that `avatars` and `tools` buckets are created
4. Check bucket policies are properly configured

### Option 2: Local Development Setup

#### 1. Start Supabase Local Development

```bash
# Make sure Docker Desktop is running first
supabase start
```

#### 2. Apply Storage Migration Locally

```bash
# Apply the migration to create storage buckets locally
supabase migration up
```

### 3. Verify Storage Buckets

After running the migration, two storage buckets will be created:

- **avatars**: For user profile pictures
  - File size limit: 5MB
  - Allowed types: PNG, JPEG, WebP, GIF
  - Public access

- **tools**: For tool submission images
  - File size limit: 10MB
  - Allowed types: PNG, JPEG, WebP
  - Public access

### 4. Storage Configuration

The storage configuration is defined in `supabase/config.toml`:

```toml
[storage]
enabled = true
file_size_limit = "50MiB"

# Local storage buckets
[[storage.buckets]]
name = "avatars"
public = true
file_size_limit = "5MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/webp", "image/gif"]

[[storage.buckets]]
name = "tools"
public = true
file_size_limit = "10MiB"
allowed_mime_types = ["image/png", "image/jpeg", "image/webp"]
```

## Implementation Details

### Storage Functions

The `src/lib/supabaseStorage.ts` file contains utility functions for:

- `uploadToSupabaseStorage()`: Upload files to storage buckets
- `deleteFromSupabaseStorage()`: Delete files from storage
- `getSignedUrl()`: Get signed URLs for private files
- `listFiles()`: List files in a bucket

### Updated Components

1. **ImageUpload Component** (`src/components/ImageUpload.tsx`)
   - Now accepts `bucket` and `folder` props
   - Uses Supabase Storage instead of Cloudinary

2. **useImageUpload Hook** (`src/hooks/useImageUpload.ts`)
   - Switched from Cloudinary to Supabase Storage
   - Added delete functionality

3. **Profile Component** (`src/pages/Profile.tsx`)
   - Added avatar upload functionality
   - Uses the `avatars` bucket for profile pictures

4. **SubmitTool Component** (`src/pages/SubmitTool.tsx`)
   - Uses the `tools` bucket for tool submission images

## Usage Examples

### Upload Avatar

```typescript
import { uploadToSupabaseStorage } from '../lib/supabaseStorage';

const handleAvatarUpload = async (file: File) => {
  try {
    const url = await uploadToSupabaseStorage(file, 'avatars', 'user-123');
    console.log('Avatar uploaded:', url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Upload Tool Image

```typescript
import { uploadToSupabaseStorage } from '../lib/supabaseStorage';

const handleToolImageUpload = async (file: File) => {
  try {
    const url = await uploadToSupabaseStorage(file, 'tools', 'submissions');
    console.log('Tool image uploaded:', url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

## Security Policies

The migration includes Row Level Security (RLS) policies for both buckets:

- **Insert**: Authenticated users can upload files
- **Update**: Users can only update their own files
- **Delete**: Users can only delete their own files
- **Select**: Public read access for all files

## Troubleshooting

### Common Issues

1. **Docker not running**: Make sure Docker Desktop is installed and running
2. **Migration fails**: Check if Supabase is started with `supabase status`
3. **Upload fails**: Verify file size and type restrictions
4. **Permission denied**: Check RLS policies and user authentication

### Useful Commands

```bash
# Check Supabase status
supabase status

# Reset local database
supabase db reset

# View storage buckets
supabase storage ls

# Stop Supabase
supabase stop
```

## Migration to Production

When deploying to production:

1. Push migrations to your Supabase project:
   ```bash
   supabase db push
   ```

2. Update environment variables if needed

3. Verify storage buckets are created in the Supabase dashboard

4. Test upload functionality in production environment

## Benefits of Supabase Storage

- **Integrated**: Works seamlessly with existing Supabase setup
- **Cost-effective**: No additional third-party service fees
- **Secure**: Built-in RLS and authentication integration
- **Scalable**: Handles large files and high traffic
- **Simple**: Easy to set up and maintain

This implementation replaces the previous Cloudinary integration and provides a more integrated solution for file uploads in the AIventory application.