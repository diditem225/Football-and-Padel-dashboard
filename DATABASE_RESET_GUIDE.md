# FiveStars Database Reset Guide

## 🎯 **What This Does**

Resets your FiveStars database to a clean state while preserving:
- ✅ Database structure and functions
- ✅ Admin user (temimi.iyed@gmail.com)
- ✅ All 8 facilities (6 football fields + 2 padel courts)
- ✅ Edge Functions and triggers

**What gets deleted:**
- ❌ All bookings and reservations
- ❌ All non-admin users
- ❌ All reviews and ratings
- ❌ All revenue data
- ❌ All waitlist entries
- ❌ All email logs

## 🚀 **3 Ways to Reset**

### **Option 1: Admin Dashboard (Easiest)**
1. Login to admin dashboard: http://localhost:3000/admin
2. Click "Reset Database" in the sidebar
3. Follow the confirmation prompts
4. Wait for completion and page refresh

### **Option 2: Simple SQL Script**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste from: `supabase/reset_database_simple.sql`
3. Run each section step by step
4. Verify results after each step

### **Option 3: Complete SQL Script**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste from: `supabase/reset_database.sql`
3. Run the entire script at once
4. Check the summary results

## 📊 **After Reset - What You'll Have**

### **Facilities (All Active)**
- Football Field 1-6: $50/hour, 14 capacity
- Padel Court 1-2: $40/hour, 4 capacity

### **Users**
- Only admin user: temimi.iyed@gmail.com
- Admin permissions: Full access

### **Data**
- 0 bookings
- 0 revenue
- 0 customers
- All time slots available

## 🔧 **Verification Steps**

After reset, check:

1. **Admin Dashboard Stats:**
   - Total bookings: 0
   - Revenue this month: $0
   - Today's bookings: 0
   - Pending payments: 0

2. **Facilities Page:**
   - All 8 facilities showing as "Active"
   - All time slots showing as "Available" (green)

3. **Users Page:**
   - Only 1 user (admin)
   - No other users listed

4. **Bookings Page:**
   - Empty table
   - "No bookings found" message

## ⚠️ **Important Notes**

- **Irreversible:** This action cannot be undone
- **Production Warning:** Never run this on live production data
- **Backup First:** Consider exporting data before reset if needed
- **Admin Preserved:** Your admin access will remain intact
- **Functions Safe:** All Edge Functions and database structure preserved

## 🆘 **If Something Goes Wrong**

1. **Admin user missing:** Re-register with temimi.iyed@gmail.com
2. **Facilities missing:** Run the facility seeding part of the SQL script
3. **Functions broken:** Re-run the Edge Function deployment
4. **Complete failure:** Restore from Supabase backup or re-run initial setup

## 📝 **Quick Reset Checklist**

- [ ] Backup any important data
- [ ] Choose reset method (Dashboard/SQL)
- [ ] Run the reset
- [ ] Verify admin access works
- [ ] Check all 8 facilities are active
- [ ] Confirm 0 bookings and users
- [ ] Test booking system works
- [ ] Ready for fresh start! 🎉

---

**Need help?** The reset is designed to be safe and preserve your core setup while giving you a clean slate for testing or going live.