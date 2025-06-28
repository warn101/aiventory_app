# AIventory - AI Tool Discovery Platform

🚀 **AIventory** is a modern, comprehensive platform for discovering, tracking, and sharing AI tools. Built with React, TypeScript, and Supabase, it provides a curated directory of AI applications with advanced search, filtering, and user interaction features.

![AIventory Platform](https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800)

## ✨ Features

### 🔍 **Discovery & Search**
- Advanced search with real-time filtering
- Category-based browsing
- Featured tools showcase
- Rating and pricing filters
- Tag-based organization

### 👤 **User Experience**
- User authentication and profiles
- Personal bookmarks and favorites
- Tool reviews and ratings
- Submission system for new tools
- Responsive design for all devices

### 🛠️ **Admin Features**
- Tool verification system
- Category management
- User analytics and stats
- Content moderation

### 🎨 **Modern UI/UX**
- Beautiful, responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Dark/light mode support
- Intuitive navigation and interactions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- Supabase account (for database)
- Docker Desktop (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd aiventory_app-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

4. **Set up the database**
   ```bash
   # Run the automated setup script
   ./setup-database.sh
   
   # Or follow the detailed guide
   open DATABASE_SETUP.md
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🗄️ Database Setup

We provide multiple ways to set up your database:

### Option 1: Automated Setup (Recommended)
```bash
./setup-database.sh
```

### Option 2: Manual Setup
See our comprehensive [Database Setup Guide](./DATABASE_SETUP.md) for detailed instructions.

### Option 3: Use Mock Data
The app works with mock data out of the box, so you can start developing immediately even without a database connection.

## 📁 Supabase Storage Setup

AIventory uses Supabase Storage for handling file uploads (user avatars and tool images). 

### Remote Setup (Recommended)
1. **Link to your remote Supabase project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. **Push storage migration to remote**:
   ```bash
   supabase db push
   ```

3. **Verify in Supabase Dashboard**: Check that storage buckets are created

### Local Development Setup
1. **Start Supabase locally** (requires Docker Desktop):
   ```bash
   supabase start
   ```

2. **Apply storage migration locally**:
   ```bash
   supabase migration up
   ```

### Storage Buckets
Two storage buckets are automatically created:
- **avatars**: User profile pictures (5MB limit, PNG/JPEG/WebP/GIF)
- **tools**: Tool submission images (10MB limit, PNG/JPEG/WebP)

### Detailed Setup Guide
For comprehensive setup instructions, troubleshooting, and usage examples, see:
📖 **[Supabase Storage Setup Guide](./SUPABASE_STORAGE_SETUP.md)**

## 📧 Email Confirmation Setup

AIventory includes a complete email confirmation system using Supabase Auth.

### ✅ **Already Configured!**
- Email confirmations are **enabled** by default
- Custom AIventory-branded email template
- Local testing with Inbucket email capture
- Production-ready with Supabase's email service

### Quick Start
```bash
# Start email confirmation system (requires Docker)
./start-email-confirmation.sh

# Or manually:
supabase start
npm run dev
```

### Testing Email Confirmation
1. **Local Development**: Check emails at http://localhost:54324 (Inbucket)
2. **Production**: Real emails sent to user's inbox

### Detailed Setup Guide
For complete configuration, troubleshooting, and customization:
📖 **[Email Confirmation Setup Guide](./EMAIL_CONFIRMATION_SETUP.md)**
📖 **[Email Setup Guide](./EMAIL_SETUP_GUIDE.md)**

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful, customizable icons

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **PostgreSQL** - Robust relational database
- **Row Level Security** - Secure data access patterns
- **Real-time subscriptions** - Live data updates

### Additional Services
- **Supabase Storage** - File upload and management
- **SendGrid** - Email notifications (future feature)
- **Vercel/Netlify** - Deployment platforms

## 📁 Project Structure

```
aiventory_app-main/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AuthModal.tsx
│   │   ├── Header.tsx
│   │   ├── ToolCard.tsx
│   │   └── ...
│   ├── pages/              # Main application pages
│   │   ├── Dashboard.tsx
│   │   ├── Profile.tsx
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useTools.ts
│   │   └── ...
│   ├── lib/                # Utility libraries
│   │   ├── supabase.ts
│   │   ├── supabaseStorage.ts
│   │   └── ...
│   ├── types/              # TypeScript type definitions
│   │   ├── index.ts
│   │   └── database.ts
│   └── data/               # Mock data and constants
│       └── mockData.ts
├── supabase/               # Database migrations and functions
│   ├── migrations/
│   └── functions/
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Database
./setup-database.sh  # Automated database setup
supabase start       # Start local Supabase
supabase stop        # Stop local Supabase
supabase status      # Check service status
```

## 🌐 Environment Variables

Create a `.env` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration
# Using Supabase's built-in email service - no external API keys needed!
# For local development: emails are captured by Inbucket (http://localhost:54324)
# For production: configure SMTP in your Supabase Dashboard if needed

# Storage Configuration
# Supabase Storage is used for file uploads (avatars, tool images)
# No additional configuration needed - uses the same Supabase credentials
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on every push

### Netlify
1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

### Manual Deployment
```bash
npm run build
# Upload the 'dist' folder to your hosting provider
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- 📖 [Database Setup Guide](./DATABASE_SETUP.md)
- 📁 [Supabase Storage Setup Guide](./SUPABASE_STORAGE_SETUP.md)
- 🐛 [Report Issues](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)
- 📧 Email: support@aiventory.com

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend platform
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) for beautiful animations
- [Lucide](https://lucide.dev) for the icon library
- All contributors and the open-source community

---

**Built with ❤️ by the AIventory Team**