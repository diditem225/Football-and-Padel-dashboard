# ⚡ Quick Start Guide

**Get your demo running in 30 minutes!**

---

## 🎯 Goal

Have a working booking system demo that you can show tomorrow.

---

## ✅ Prerequisites (5 minutes)

Install these if you don't have them:

```bash
# Check Node.js (need 18+)
node --version

# Check npm
npm --version

# Install Supabase CLI
npm install -g supabase
```

**Also need:**
- Supabase account (free): https://supabase.com
- Git installed
- Code editor (VS Code recommended)

---

## 🚀 Setup (25 minutes)

### Step 1: Supabase Project (10 min)

1. **Create Project**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Name: `sports-booking-demo`
   - Choose region closest to Tunisia
   - Save database password!
   - Wait ~2 minutes for project creation

2. **Get Credentials**
   - Go to Settings > API
   - Copy `Project URL`
   - Copy `anon public` key
   - Save these somewhere safe

3. **Deploy Backend**
   
   **Windows:**
   ```bash
   # In project root
   deploy-demo.bat
   ```
   
   **Mac/Linux:**
   ```bash
   # In project root
   chmod +x deploy-demo.sh
   ./deploy-demo.sh
   ```
   
   This will:
   - Link your project
   - Push database migrations
   - Deploy Edge Functions

4. **Create Admin User**
   - Go to Supabase Dashboard
   - Authentication > Users > Add User
   - Email: `admin@demo.com`
   - Password: `Admin123!` (or your choice)
   - Click "Create user"
   - Copy the User ID
   
   - Go to SQL Editor
   - Run this (replace USER_ID):
   ```sql
   UPDATE public.user_profiles 
   SET is_admin = true 
   WHERE id = 'YOUR_USER_ID';
   ```

### Step 2: Frontend (10 min)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your credentials
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...

# Start dev server
npm run dev
```

Open http://localhost:3000

### Step 3: Test (5 min)

1. **Register User**
   - Click "Sign Up"
   - Email: `test@demo.com`
   - Password: `Test123!`
   - Fill other fields
   - Submit

2. **Create Booking**
   - Click "Book Now"
   - Select tomorrow
   - Click green slot
   - Confirm
   - Get confirmation code!

3. **Test Admin**
   - Sign out
   - Sign in as `admin@demo.com`
   - Go to `/admin`
   - See all bookings
   - Mark one as paid

---

## ✅ Verification

Your demo is ready if:

- [ ] Can register new users
- [ ] Can create bookings
- [ ] Can view bookings in dashboard
- [ ] Can access admin dashboard
- [ ] Real-time updates work (open two windows)
- [ ] Mobile responsive (resize browser)
- [ ] Light/Dark mode works

---

## 🎬 Demo It!

**10-Minute Demo Flow:**

1. Show home page (1 min)
2. Register user (1 min)
3. Create booking (2 min)
4. View dashboard (1 min)
5. Show admin features (3 min)
6. Show real-time updates (1 min)
7. Show mobile/dark mode (1 min)

See [DEMO_QUICK_REFERENCE.md](./DEMO_QUICK_REFERENCE.md) for detailed script.

---

## 🐛 Issues?

**Most common fixes:**

1. **"Unauthorized" errors**
   - Check Edge Functions deployed
   - Verify .env.local has correct values
   - Try logging out and back in

2. **Bookings not showing**
   - Check browser console (F12)
   - Verify user is logged in
   - Refresh page

3. **Admin access denied**
   - Verify SQL query ran successfully
   - Check is_admin = true in database
   - Log out and back in

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more help.

---

## 📚 Full Documentation

- **Setup Guide**: [DEMO_SETUP.md](./DEMO_SETUP.md)
- **Demo Script**: [DEMO_QUICK_REFERENCE.md](./DEMO_QUICK_REFERENCE.md)
- **Checklist**: [DEMO_CHECKLIST.md](./DEMO_CHECKLIST.md)
- **Summary**: [DEMO_SUMMARY.md](./DEMO_SUMMARY.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 🎉 Success!

You now have a working booking system demo!

**What's included:**
- ✅ User authentication
- ✅ Real-time booking calendar
- ✅ Admin dashboard
- ✅ Mobile responsive
- ✅ Light/Dark mode

**What's simplified:**
- ❌ No email notifications (toast messages)
- ❌ No waitlist system (show "Booked")
- ❌ No recurring bookings (single only)

**Next steps:**
- Practice your demo
- Test on mobile device
- Deploy to production (optional)
- Add more features (see tasks.md)

---

**🚀 You're ready to demo tomorrow!**

**Time spent:** 30 minutes
**Demo time:** 10 minutes
**Confidence:** 🟢 High

Good luck! 🍀
