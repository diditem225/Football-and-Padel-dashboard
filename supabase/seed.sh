#!/bin/bash

# Database Seeding Script for Sports Complex Booking System
# This script applies all migrations and seeds the database

set -e  # Exit on error

echo "🏟️  Sports Complex Booking System - Database Seeding"
echo "=================================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Error: Supabase project not linked"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "✅ Supabase project linked"
echo ""

# Apply all migrations
echo "📦 Applying database migrations..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migrations applied successfully"
else
    echo "❌ Error applying migrations"
    exit 1
fi

echo ""
echo "🎉 Database seeding complete!"
echo ""
echo "Next steps:"
echo "1. Verify facilities: supabase db shell"
echo "   Then run: SELECT * FROM public.facilities;"
echo ""
echo "2. Create admin user:"
echo "   - Sign up via the application or Supabase dashboard"
echo "   - Update supabase/migrations/20240420000007_seed_test_admin.sql with your email"
echo "   - Run: supabase db push"
echo ""
echo "3. See SEEDING_GUIDE.md for detailed instructions"
echo ""
