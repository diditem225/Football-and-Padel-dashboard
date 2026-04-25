@echo off
REM Database Seeding Script for Sports Complex Booking System (Windows)
REM This script applies all migrations and seeds the database

echo.
echo 🏟️  Sports Complex Booking System - Database Seeding
echo ==================================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Supabase CLI is not installed
    echo Install it with: npm install -g supabase
    exit /b 1
)

echo ✅ Supabase CLI found
echo.

REM Check if project is linked
if not exist ".supabase\config.toml" (
    echo ❌ Error: Supabase project not linked
    echo Run: supabase link --project-ref YOUR_PROJECT_REF
    exit /b 1
)

echo ✅ Supabase project linked
echo.

REM Apply all migrations
echo 📦 Applying database migrations...
supabase db push

if %ERRORLEVEL% EQU 0 (
    echo ✅ Migrations applied successfully
) else (
    echo ❌ Error applying migrations
    exit /b 1
)

echo.
echo 🎉 Database seeding complete!
echo.
echo Next steps:
echo 1. Verify facilities: supabase db shell
echo    Then run: SELECT * FROM public.facilities;
echo.
echo 2. Create admin user:
echo    - Sign up via the application or Supabase dashboard
echo    - Update supabase/migrations/20240420000007_seed_test_admin.sql with your email
echo    - Run: supabase db push
echo.
echo 3. See SEEDING_GUIDE.md for detailed instructions
echo.

pause
