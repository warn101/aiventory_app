# Database Setup Guide for AIventory

This guide will help you set up the Supabase database for your AIventory project. You have two options: **Local Development** or **Cloud Setup**.

## Option 1: Cloud Setup (Recommended for Quick Start)

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - Name: `aiventory`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your location)
6. Click "Create new project"

### Step 2: Get Your Project Credentials
1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL** (something like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### Step 3: Update Environment Variables
Update your `.env` file with the actual values:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here

# Cloudinary Configuration (Optional)
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Email Configuration
# Using Supabase's built-in email service - no external API keys needed!
# For local development: emails are captured by Inbucket (http://localhost:54324)
# For production: configure SMTP in your Supabase Dashboard if needed
```

### Step 4: Run Database Migrations
```bash
# Link your local project to the cloud project
supabase link --project-ref your-project-ref

# Push the existing migrations to your cloud database
supabase db push
```

### Step 5: Verify Setup
```bash
# Check if migrations were applied successfully
supabase db diff

# Start your development server
npm run dev
```

## Option 2: Local Development Setup

### Prerequisites
1. **Install Docker Desktop**
   - Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
   - Install and start Docker Desktop
   - Verify installation: `docker --version`

### Step 1: Start Local Supabase
```bash
# Start local Supabase (this will download and start all services)
supabase start
```

This command will:
- Download necessary Docker images
- Start PostgreSQL, PostgREST, GoTrue, Realtime, and other services
- Apply your existing migrations
- Provide you with local URLs and keys

### Step 2: Update Environment Variables
After `supabase start` completes, you'll see output like:
```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
        Inbucket URL: http://localhost:54324
          anon key: eyJ...
   service_role key: eyJ...
```

Update your `.env` file:
```env
# Supabase Configuration (Local)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key_from_output

# Other configurations remain the same
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
SENDGRID_API_KEY=your_sendgrid_api_key
```

### Step 3: Access Supabase Studio
Open http://localhost:54323 in your browser to access the local Supabase Studio where you can:
- View your database tables
- Run SQL queries
- Manage authentication
- View logs

## Database Schema Overview

Your project includes these tables:
- **categories** - Tool categories with icons and colors
- **tools** - AI tools with ratings, pricing, and metadata
- **profiles** - Extended user profiles linked to auth.users
- **bookmarks** - User bookmarks for tools
- **reviews** - User reviews and ratings for tools

## Useful Commands

```bash
# View migration status
supabase migration list

# Create a new migration
supabase migration new migration_name

# Reset local database (WARNING: destroys all data)
supabase db reset

# Stop local services
supabase stop

# View logs
supabase logs

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.ts
```

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```
   Error: Cannot connect to the Docker daemon
   ```
   **Solution**: Start Docker Desktop

2. **Port conflicts**
   ```
   Error: Port 54321 is already in use
   ```
   **Solution**: Stop other services or change ports in `supabase/config.toml`

3. **Migration errors**
   ```
   Error: relation "table_name" already exists
   ```
   **Solution**: Reset database with `supabase db reset`

4. **Environment variables not loading**
   **Solution**: Restart your development server after updating `.env`

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Community Discord](https://discord.supabase.com/)

## Next Steps

After setting up the database:
1. Test the connection by running `npm run dev`
2. Check the browser console for any connection errors
3. Try creating a user account to test authentication
4. Submit a test tool to verify the full workflow

The application will fall back to mock data if the database connection fails, so you can develop even without a fully configured database.