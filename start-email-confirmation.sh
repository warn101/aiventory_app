#!/bin/bash

# AIventory Email Confirmation Setup Script
# This script helps you start the email confirmation system

echo "🚀 AIventory Email Confirmation Setup"
echo "====================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "📋 Please start Docker Desktop first:"
    echo "   1. Open Docker Desktop application"
    echo "   2. Wait for it to start completely"
    echo "   3. Run this script again"
    echo ""
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed!"
    echo "📋 Install it with:"
    echo "   npm install -g supabase"
    echo "   # or"
    echo "   brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI is installed"
echo ""

# Start Supabase
echo "🔄 Starting Supabase with email confirmation enabled..."
supabase start

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Email confirmation system is now running!"
    echo ""
    echo "📧 Email Testing:"
    echo "   • Inbucket (local emails): http://localhost:54324"
    echo "   • Supabase Studio: http://localhost:54323"
    echo ""
    echo "🌐 Your App:"
    echo "   • Start with: npm run dev"
    echo "   • Access at: http://localhost:5173"
    echo ""
    echo "✨ Test email confirmation:"
    echo "   1. Sign up with a new account"
    echo "   2. Check emails at http://localhost:54324"
    echo "   3. Click the confirmation link"
    echo "   4. Sign in with verified account"
    echo ""
else
    echo "❌ Failed to start Supabase"
    echo "📋 Try:"
    echo "   supabase stop"
    echo "   supabase start"
    echo ""
fi