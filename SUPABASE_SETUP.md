# Supabase Database Setup Guide

## Step 1: Run Initial Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/20240420000000_initial_schema.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for "Success. No rows returned" message

This will create:
- ✅ All database tables (users, facilities, bookings, waitlist, reviews, etc.)
- ✅ Indexes for performance
- ✅ Automatic user profile creation on signup
- ✅ 6 Football Fields and 2 Padel Courts

## Step 2: Enable Row Level Security

1. In the same SQL Editor, click **New Query**
2. Copy the entire contents of `supabase/migrations/20240420000001_rls_policies.sql`
3. Paste it into the SQL Editor
4. Click **Run**
5. Wait for "Success. No rows returned" message

This will:
- ✅ Enable RLS on all tables
- ✅ Set up security policies (users can only see their own data)
- ✅ Give admins full access to everything

## Step 3: Verify Setup

1. Go to **Table Editor** in the left sidebar
2. You should see these tables:
   - user_profiles
   - facilities (should have 8 rows: 6 football fields + 2 padel courts)
   - bookings
   - waitlist_entries
   - reviews
   - no_show_records
   - email_logs

3. Click on **facilities** table
4. You should see 8 facilities listed

## Step 4: Test Authentication

1. Go back to your app: http://localhost:3000
2. Click **Sign Up**
3. Fill in the form and create an account
4. Check your email for confirmation link
5. Click the confirmation link
6. Go back to app and **Sign In**

## ✅ You're Done!

Your database is now fully set up and ready to use! 🎉

## Next Steps

Once authentication works, we'll build:
- 📅 Booking calendar with real-time availability
- 🎯 Smart waitlist system
- 📧 Email notifications
- 👨‍💼 Admin dashboard
- ⭐ Review system
- 🚫 No-show tracking

## Troubleshooting

**If signup fails:**
- Make sure you ran both SQL files
- Check that email confirmation is enabled in Supabase Auth settings
- Verify your .env.local has the correct SUPABASE_URL and SUPABASE_ANON_KEY

**If you see "row level security" errors:**
- Make sure you ran the RLS policies SQL file
- Check that the policies were created in the SQL Editor

**Need help?**
Let me know what error you're seeing and I'll help you fix it!
