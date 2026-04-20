# Testing Guide - Sports Complex Booking System

## 🎯 What's New

We've just implemented the core booking system with real-time updates! Here's what you can test:

## 🚀 Quick Start

1. **Dev Server**: Already running at http://localhost:3000
2. **Supabase**: Connected and configured
3. **Admin Access**: Your account should now have admin privileges

## ✅ Features to Test

### 1. Homepage (/)
- ✨ Beautiful animated hero section
- 🎨 Theme toggle (bottom right corner)
- 📊 Stats display
- 🔗 Navigation to booking and other pages

### 2. Booking Calendar (/booking)
**What to test:**
- View all 8 facilities (6 football fields, 2 padel courts)
- Navigate between dates (Previous/Next/Today buttons)
- Click on available (green) slots to book
- See booking confirmation modal with details
- Confirm booking and get confirmation code
- Watch real-time updates (open in 2 browser tabs and book in one)

**Expected behavior:**
- Available slots show in green
- Booked slots show in red
- Clicking a booked slot shows error message
- Must be logged in to book
- Confirmation code is auto-generated

### 3. User Dashboard (/dashboard)
**What to test:**
- View upcoming bookings
- View past bookings
- Cancel a booking
- Watch real-time updates

**Expected behavior:**
- Bookings sorted by date/time
- Status badges show correctly
- Cancel button works
- Real-time updates when booking from another tab

### 4. Admin Dashboard (/admin)
**What to test:**
- View statistics (total bookings, today's bookings, revenue)
- See all bookings in table format
- Mark bookings as paid
- Cancel any booking
- Watch real-time updates

**Expected behavior:**
- Only accessible if you're an admin
- Stats update in real-time
- Can manage all users' bookings
- Payment status toggles correctly

### 5. Authentication
**What to test:**
- Login (/login)
- Register (/register)
- Logout (header button)
- Protected routes redirect to login

## 🧪 Test Scenarios

### Scenario 1: Complete Booking Flow
1. Go to homepage
2. Click "Book Now"
3. Select today's date
4. Choose a facility and time slot
5. Confirm booking
6. Go to dashboard to see your booking
7. Try to book the same slot again (should fail)

### Scenario 2: Real-time Updates
1. Open app in 2 browser tabs
2. Login in both tabs
3. In tab 1: Go to booking page
4. In tab 2: Go to booking page
5. In tab 1: Book a slot
6. Watch tab 2 update automatically (slot turns red)

### Scenario 3: Admin Management
1. Login as admin
2. Go to /admin
3. View all bookings
4. Mark a booking as paid
5. Cancel a booking
6. Check user dashboard to see changes

### Scenario 4: Theme Toggle
1. Click theme toggle (bottom right)
2. Watch smooth transition to dark mode
3. Navigate to different pages
4. Theme should persist
5. Refresh page - theme should remain

## 🐛 Known Limitations (To Be Implemented)

- ❌ Waitlist system not yet implemented
- ❌ Email notifications not yet implemented
- ❌ No-show tracking not yet implemented
- ❌ Review system not yet implemented
- ❌ 96-hour cancellation window not enforced yet
- ❌ Football field player count validation not implemented

## 📱 Responsive Testing

Test on different screen sizes:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

All pages should be fully responsive!

## 🎨 Visual Testing

Check these visual elements:
- ✅ Smooth animations on page load
- ✅ Hover effects on buttons
- ✅ Toast notifications appear correctly
- ✅ Modals center properly
- ✅ Loading spinners show during data fetch
- ✅ Status badges have correct colors
- ✅ Dark mode looks good on all pages

## 🔍 Database Verification

You can check Supabase directly:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Table Editor
4. Check these tables:
   - `facilities` (should have 8 rows)
   - `bookings` (should show your test bookings)
   - `user_profiles` (should show your profile with is_admin=true)

## 💡 Tips

- Use Chrome DevTools to test responsive design
- Open Network tab to see real-time subscriptions
- Check Console for any errors
- Try booking multiple slots in quick succession
- Test with multiple user accounts if possible

## 🎉 Success Criteria

You'll know everything is working if:
1. ✅ You can book a slot and see it in your dashboard
2. ✅ Real-time updates work across tabs
3. ✅ Admin dashboard shows all bookings
4. ✅ Theme toggle works smoothly
5. ✅ No console errors
6. ✅ All pages are responsive
7. ✅ Animations are smooth

## 🆘 Troubleshooting

**Problem**: Can't access admin dashboard
- **Solution**: Run the SQL script in `supabase/migrations/20240420000002_manual_admin_setup.sql`

**Problem**: Bookings don't show up
- **Solution**: Check Supabase connection in browser console

**Problem**: Real-time updates not working
- **Solution**: Check if Supabase Realtime is enabled in your project settings

**Problem**: Theme doesn't persist
- **Solution**: Check browser localStorage (should have 'theme' key)

## 📞 Next Steps

After testing, we can implement:
1. Waitlist system with claim functionality
2. Email notifications via SendGrid
3. No-show tracking and restrictions
4. Review system
5. Contact page
6. Edge Functions for business logic

Enjoy testing! 🚀
