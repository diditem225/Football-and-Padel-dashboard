# 🚀 Connect Supabase - Complete Guide

## Step 1: Create Supabase Project (5 minutes)

### 1.1 Sign Up & Create Project
1. Go to: **https://supabase.com/dashboard**
2. Sign up with GitHub/Google (fastest)
3. Click **"New Project"**
4. Fill in:
   - **Name:** `sports-booking-demo`
   - **Database Password:** `MyDemo123!` (write this down!)
   - **Region:** Choose closest to you
5. Click **"Create new project"**
6. ⏳ Wait 2-3 minutes for setup

### 1.2 Get Your Credentials
1. Once ready, go to **Settings** → **API**
2. Copy these values:
   - **Project URL:** `https://abcdefgh.supabase.co`
   - **anon public key:** `eyJ...` (long string)

## Step 2: Update Environment File (1 minute)

1. **Open:** `frontend/.env.local`
2. **Replace the placeholder values:**

```env
# Replace with YOUR actual values
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE

# Keep these as-is
VITE_APP_URL=http://localhost:3000
VITE_ENVIRONMENT=development
VITE_CANCELLATION_WINDOW_HOURS=96
VITE_CLAIM_WINDOW_HOURS=12
VITE_FOOTBALL_MIN_PLAYERS=14
```

## Step 3: Set Up Database (5 minutes)

### 3.1 Run SQL Setup Script
1. **Go to:** Supabase Dashboard → **SQL Editor**
2. **Copy the entire content** from `SUPABASE_SETUP.sql`
3. **Paste it** into the SQL Editor
4. **Click "Run"** (takes ~30 seconds)
5. ✅ You should see "Success. No rows returned"

### 3.2 Verify Tables Created
1. Go to **Database** → **Tables**
2. You should see:
   - ✅ user_profiles
   - ✅ facilities (with 8 facilities)
   - ✅ bookings
   - ✅ waitlist_entries
   - ✅ reviews
   - ✅ no_show_records
   - ✅ email_logs

## Step 4: Deploy Edge Functions (5 minutes)

### 4.1 Create Functions in Supabase Dashboard

**Function 1: create-booking**
1. Go to **Edge Functions** → **Create a new function**
2. **Name:** `create-booking`
3. **Copy and paste** the content from `supabase/functions/create-booking/index.ts`
4. **Click "Deploy function"**

**Function 2: cancel-booking**
1. **Create a new function**
2. **Name:** `cancel-booking`
3. **Copy and paste** the content from `supabase/functions/cancel-booking/index.ts`
4. **Click "Deploy function"**

**Function 3: mark-booking-paid**
1. **Create a new function**
2. **Name:** `mark-booking-paid`
3. **Copy and paste** the content from `supabase/functions/mark-booking-paid/index.ts`
4. **Click "Deploy function"**

### 4.2 Verify Functions
- Go to **Edge Functions**
- You should see 3 functions with "Active" status

## Step 5: Create Admin User (3 minutes)

### 5.1 Create User Account
1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email:** `admin@demo.com`
   - **Password:** `Admin123!`
   - **Auto Confirm User:** ✅ Check this
4. Click **"Create user"**
5. **Copy the User ID** (looks like: `12345678-1234-1234-1234-123456789abc`)

### 5.2 Make User Admin
1. Go to **SQL Editor**
2. Run this query (replace `USER_ID`):

```sql
UPDATE public.user_profiles 
SET is_admin = true 
WHERE id = 'YOUR_USER_ID_HERE';
```

3. ✅ Should return "UPDATE 1"

## Step 6: Restart Your App (1 minute)

1. **Stop the dev server:** Press `Ctrl + C` in terminal
2. **Start it again:** `npm run dev`
3. **Open:** http://localhost:3000

## Step 7: Test Everything! (5 minutes)

### 7.1 Test User Registration
1. Click **"Sign Up"**
2. Create a new account
3. ✅ Should work without errors

### 7.2 Test Booking
1. **Sign in** with your new account
2. Click **"Book Now"**
3. Select a date and time slot
4. Click a green slot
5. ✅ Should create booking with confirmation code

### 7.3 Test Admin Dashboard
1. **Sign out**
2. **Sign in** with `admin@demo.com` / `Admin123!`
3. Go to: **http://localhost:3000/admin**
4. ✅ Should see admin dashboard with all bookings

### 7.4 Test Admin Features
1. **Mark a booking as paid** (click the $ button)
2. **Cancel any booking** (admins can bypass 96-hour rule)
3. ✅ Should work instantly

## 🎉 Success! You're Connected!

**What works now:**
- ✅ Real user registration/login
- ✅ Create actual bookings
- ✅ View your bookings
- ✅ Cancel bookings (96-hour rule)
- ✅ Admin dashboard
- ✅ Mark bookings as paid
- ✅ Real-time updates
- ✅ Double-booking prevention

**Demo credentials:**
- **Admin:** admin@demo.com / Admin123!
- **Regular user:** Create your own

## 🚨 Troubleshooting

### "Failed to fetch" errors
- ✅ Check environment variables are correct
- ✅ Restart dev server after changing .env.local
- ✅ Verify Supabase project is active

### "Unauthorized" errors
- ✅ Check Edge Functions are deployed
- ✅ Verify user is logged in
- ✅ Check admin status in database

### Bookings not showing
- ✅ Check SQL setup completed successfully
- ✅ Verify RLS policies are enabled
- ✅ Check browser console for errors

### Admin dashboard not accessible
- ✅ Verify user has `is_admin = true`
- ✅ Log out and back in
- ✅ Check URL is `/admin`

## 📱 Next Steps

### Deploy to Production (Optional)
1. **Push to GitHub**
2. **Deploy to Vercel/Netlify**
3. **Add environment variables**
4. **Update Supabase CORS settings**

### Add More Features
- Email notifications (SendGrid)
- Waitlist system
- Payment integration
- SMS notifications

---

## 🎯 Quick Commands

**Restart dev server:**
```bash
# Stop: Ctrl + C
npm run dev
```

**Check Supabase connection:**
```javascript
// In browser console
supabase.auth.getUser()
```

**Test booking creation:**
```javascript
// In browser console (when logged in)
fetch('/api/create-booking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    facility_id: 'facility-id',
    booking_date: '2024-04-25',
    start_time: '14:00',
    end_time: '15:00'
  })
})
```

---

**🎉 Congratulations! Your sports booking system is now fully functional!**