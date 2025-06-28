#!/bin/bash

# AIventory Database Setup Script
# This script helps automate the database setup process

set -e  # Exit on any error

echo "🚀 AIventory Database Setup"
echo "============================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Please install it first:"
    echo "  brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase --version)"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your actual credentials."
else
    echo "✅ .env file already exists."
fi

# Ask user for setup preference
echo ""
echo "Choose your setup option:"
echo "1) Cloud Setup (Recommended)"
echo "2) Local Development Setup"
echo "3) Just show me the guide"
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🌐 Cloud Setup Selected"
        echo "======================"
        echo "Please follow these steps:"
        echo "1. Go to https://supabase.com and create a new project"
        echo "2. Get your Project URL and Anon Key from Project Settings → API"
        echo "3. Update your .env file with the actual values"
        echo "4. Run: supabase link --project-ref YOUR_PROJECT_REF"
        echo "5. Run: supabase db push"
        echo ""
        echo "📖 For detailed instructions, see DATABASE_SETUP.md"
        ;;
    2)
        echo ""
        echo "🐳 Local Development Setup"
        echo "=========================="
        
        # Check if Docker is running
        if ! docker info &> /dev/null; then
            echo "❌ Docker is not running."
            echo "Please install and start Docker Desktop:"
            echo "  https://www.docker.com/products/docker-desktop/"
            exit 1
        fi
        
        echo "✅ Docker is running"
        echo "🚀 Starting local Supabase..."
        
        # Start Supabase
        supabase start
        
        echo ""
        echo "✅ Local Supabase is running!"
        echo "📖 Check the output above for your local URLs and keys"
        echo "🔧 Update your .env file with the local credentials"
        echo "🌐 Access Supabase Studio at: http://localhost:54323"
        ;;
    3)
        echo ""
        echo "📖 Opening setup guide..."
        if command -v open &> /dev/null; then
            open DATABASE_SETUP.md
        else
            echo "Please read DATABASE_SETUP.md for detailed instructions"
        fi
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup process initiated!"
echo "📖 For detailed instructions, see DATABASE_SETUP.md"
echo "🚀 Once configured, run: npm run dev"