# 🔧 Troubleshooting Guide

Common issues and their solutions for the Sports Complex Booking System demo.

---

## 🚨 Critical Issues

### Issue: "Cannot connect to Supabase"

**Symptoms:**
- All API calls fail
- "Network error" messages
- Nothing loads

**Solutions:**
1. Check Supabase project is active (not paused)
2. Verify environment variables in `.env.local`:
   ```bash
   cat frontend/.env.local
   ```
3. Check Supabase dashboard status
4. Verify internet connection
5. Try restarting dev server:
   ```bash
   cd frontend
   npm run dev
   ```

---

### Issue: "Unauthorized" or "403 Forbidden"

**Symptoms:**
- Can't create bookings
- Can't access admin dashboard
- "Unauthorized" errors

**Solutions:**

**For regular users:**
1. Verify user is logged in:
   ```javascript
   // Check in browser console
   localStorage.getItem('supabase.auth.token')
   ```
2. Try logging out and back in
3. Clear browser cache and cookies
4. Check RLS policies in Supabase

**For admin users:**
1. Verify admin status in database:
   ```sql
   SELECT id, email, is_admin 
   FROM auth.users u
   JOIN user_profiles p ON u.id = p.id
   WHERE u.email = 'admin@demo.com';
   ```
2. If `is_admin` is false, run:
   ```sql
   UPDATE user_profiles 
   SET is_admin = true 
   WHERE id = 'USER_ID';
   ```
3. Log out and back in

---

### Issue: Edge Functions Not Working

**Symptoms:**
- Bookings fail to create
- "Function not found" errors
- 404 errors on function calls

**Solutions:**
1. Verify functions are deployed:
   ```bash
   supabase functions list
   ```
2. Redeploy functions:
   ```bash
   supabase functions deploy create-booking
   supabase functions deploy cancel-booking
   supabase functions deploy mark-booking-paid
   ```
3. Check function logs in Supabase Dashboard:
   - Go to Edge Functions
   - Click on function name
   - View logs
4. Verify CORS headers in function code

---

## ⚠️ Common Issues

### Issue: Bookings Not Showing in Calendar

**Symptoms:**
- Calendar shows all slots as available
- Created bookings don't appear
- Dashboard is empty

**Solutions:**
1. Check if bookings exist in database:
   ```sql
   SELECT * FROM bookings 
   WHERE user_id = 'YOUR_USER_ID'
   ORDER BY created_at DESC;
   ```
2. Verify RLS policies allow reading:
   ```sql
   SELECT * FROM bookings; -- Should work if logged in
   ```
3. Check browser console for errors (F12)
4. Verify date format is correct (YYYY-MM-DD)
5. Try refreshing the page

---

### Issue: Double Booking Allowed

**Symptoms:**
- Two users can book same slot
- No conflict error shown

**Solutions:**
1. Check unique index exists:
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'bookings' 
   AND indexname = 'idx_no_booking_conflicts';
   ```
2. If missing, create it:
   ```sql
   CREATE UNIQUE INDEX idx_no_booking_conflicts 
   ON bookings(facility_id, booking_date, start_time)
   WHERE status IN ('confirmed', 'pending_payment');
   ```
3. Verify Edge Function checks for conflicts
4. Test with two browser windows

---

### Issue: Real-time Updates Not Working

**Symptoms:**
- Changes don't appear in other windows
- Need to refresh to see updates
- WebSocket connection fails

**Solutions:**
1. Enable Realtime in Supabase:
   - Dashboard > Settings > API
   - Enable Realtime
   - Save changes
2. Check Realtime subscriptions:
   ```javascript
   // In browser console
   supabase.getChannels()
   ```
3. Verify table is enabled for Realtime:
   - Dashboard > Database > Replication
   - Enable for `bookings` table
4. Check WebSocket connection:
   - F12 > Network > WS tab
   - Should see active connection
5. Try restarting dev server

---

### Issue: Admin Dashboard Shows "Access Denied"

**Symptoms:**
- Can't access /admin route
- Redirected to home page
- "Not authorized" message

**Solutions:**
1. Verify logged in as admin user
2. Check admin status:
   ```sql
   SELECT u.email, p.is_admin 
   FROM auth.users u
   JOIN user_profiles p ON u.id = p.id
   WHERE u.id = auth.uid();
   ```
3. Update admin status if needed:
   ```sql
   UPDATE user_profiles 
   SET is_admin = true 
   WHERE id = auth.uid();
   ```
4. Clear browser cache
5. Log out and back in
6. Check ProtectedRoute component

---

### Issue: Can't Cancel Booking

**Symptoms:**
- Cancel button doesn't work
- Error: "Cannot cancel within 96 hours"
- Cancellation fails

**Solutions:**

**If within 96 hours:**
- This is expected behavior
- Only admins can cancel within window
- Try with admin account

**If outside 96 hours:**
1. Check booking date/time:
   ```javascript
   // In browser console
   const booking = { booking_date: '2024-01-20', start_time: '14:00' }
   const bookingTime = new Date(`${booking.booking_date}T${booking.start_time}`)
   const hoursUntil = (bookingTime - new Date()) / (1000 * 60 * 60)
   console.log('Hours until booking:', hoursUntil)
   ```
2. Verify Edge Function logic
3. Check browser console for errors
4. Try with admin account (should always work)

---

## 🐛 UI Issues

### Issue: Dark Mode Not Working

**Symptoms:**
- Toggle doesn't change theme
- Stuck in light or dark mode
- Theme resets on refresh

**Solutions:**
1. Check localStorage:
   ```javascript
   localStorage.getItem('theme')
   ```
2. Clear theme storage:
   ```javascript
   localStorage.removeItem('theme')
   ```
3. Check ThemeContext is wrapping App
4. Verify Tailwind dark mode config:
   ```javascript
   // tailwind.config.js
   darkMode: 'class'
   ```
5. Refresh page

---

### Issue: Mobile Layout Broken

**Symptoms:**
- Elements overflow on mobile
- Text too small
- Buttons not clickable

**Solutions:**
1. Check viewport meta tag in index.html:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   ```
2. Test responsive breakpoints:
   - Mobile: 320px - 767px
   - Tablet: 768px - 1023px
   - Desktop: 1024px+
3. Check Tailwind responsive classes (sm:, md:, lg:)
4. Use browser DevTools device emulation
5. Test on actual mobile device

---

### Issue: Animations Not Working

**Symptoms:**
- No smooth transitions
- Elements appear instantly
- Framer Motion not animating

**Solutions:**
1. Check Framer Motion is installed:
   ```bash
   npm list framer-motion
   ```
2. Verify motion components used:
   ```jsx
   <motion.div> not <div>
   ```
3. Check animation props are correct
4. Disable browser motion preferences:
   - Settings > Accessibility
   - Disable "Reduce motion"
5. Check browser console for errors

---

## 🗄️ Database Issues

### Issue: Migrations Failed

**Symptoms:**
- Tables don't exist
- "relation does not exist" errors
- Schema mismatch

**Solutions:**
1. Check migration status:
   ```bash
   supabase db remote list
   ```
2. Reset and reapply migrations:
   ```bash
   supabase db reset
   supabase db push
   ```
3. Manually run migrations in SQL Editor
4. Check for syntax errors in migration files
5. Verify Supabase CLI version:
   ```bash
   supabase --version
   ```

---

### Issue: RLS Policies Blocking Access

**Symptoms:**
- Can't read/write data
- "permission denied" errors
- Empty results

**Solutions:**
1. Check RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
2. View policies:
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'public';
   ```
3. Test policy:
   ```sql
   -- As authenticated user
   SELECT * FROM bookings WHERE user_id = auth.uid();
   ```
4. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
   -- Remember to re-enable!
   ```
5. Check policy definitions in migrations

---

## 🔐 Authentication Issues

### Issue: Can't Register New Users

**Symptoms:**
- Registration fails
- "Email already exists" error
- No confirmation email

**Solutions:**
1. Check email is unique:
   ```sql
   SELECT email FROM auth.users WHERE email = 'test@demo.com';
   ```
2. Disable email confirmation (for demo):
   - Dashboard > Authentication > Settings
   - Disable "Enable email confirmations"
3. Check password requirements:
   - Minimum 8 characters
   - At least one letter and number
4. Verify Supabase Auth is enabled
5. Check browser console for errors

---

### Issue: Session Expires Too Quickly

**Symptoms:**
- Logged out frequently
- "Session expired" errors
- Need to login repeatedly

**Solutions:**
1. Check JWT expiry in Supabase:
   - Dashboard > Settings > API
   - JWT expiry: 3600 seconds (1 hour)
2. Enable auto-refresh in client:
   ```typescript
   createClient(url, key, {
     auth: {
       autoRefreshToken: true,
       persistSession: true
     }
   })
   ```
3. Check localStorage for token:
   ```javascript
   localStorage.getItem('supabase.auth.token')
   ```
4. Clear old sessions:
   ```javascript
   supabase.auth.signOut()
   ```

---

## 🌐 Network Issues

### Issue: Slow API Responses

**Symptoms:**
- Bookings take >5 seconds
- Calendar loads slowly
- Timeouts

**Solutions:**
1. Check Supabase region (should be close to users)
2. Verify database indexes exist:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'bookings';
   ```
3. Check Edge Function performance:
   - Dashboard > Edge Functions > Logs
   - Look for slow queries
4. Optimize queries (use indexes)
5. Enable connection pooling
6. Check internet connection speed

---

### Issue: CORS Errors

**Symptoms:**
- "CORS policy" errors in console
- API calls blocked
- Cross-origin errors

**Solutions:**
1. Add CORS headers to Edge Functions:
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   }
   ```
2. Configure allowed origins in Supabase:
   - Dashboard > Settings > API
   - Add your domain
3. For local development, use:
   - http://localhost:3000
   - http://localhost:5173
4. Check preflight OPTIONS requests

---

## 🧪 Testing Issues

### Issue: Can't Test with Multiple Users

**Symptoms:**
- Need multiple accounts
- Can't simulate concurrent bookings

**Solutions:**
1. Use incognito/private windows
2. Use different browsers
3. Create multiple test accounts:
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO auth.users (email, encrypted_password)
   VALUES ('test1@demo.com', crypt('password', gen_salt('bf')));
   ```
4. Use browser profiles
5. Test on different devices

---

## 📱 Mobile-Specific Issues

### Issue: Touch Events Not Working

**Symptoms:**
- Can't tap buttons on mobile
- Swipe gestures don't work
- Hover effects stuck

**Solutions:**
1. Use touch-friendly sizes (min 44x44px)
2. Add touch event handlers:
   ```jsx
   onTouchStart={handleTouch}
   ```
3. Disable hover on touch devices:
   ```css
   @media (hover: none) {
     .hover-effect { /* disable */ }
   }
   ```
4. Test with actual mobile device
5. Use Chrome DevTools mobile emulation

---

## 🔍 Debugging Tools

### Browser Console Commands

```javascript
// Check authentication
supabase.auth.getUser()

// Check session
supabase.auth.getSession()

// List channels
supabase.getChannels()

// Test query
supabase.from('bookings').select('*').then(console.log)

// Check environment
console.log(import.meta.env)
```

### Supabase Dashboard

1. **Logs**: Dashboard > Logs
   - API logs
   - Edge Function logs
   - Database logs

2. **SQL Editor**: Dashboard > SQL Editor
   - Run queries
   - Check data
   - Test policies

3. **Table Editor**: Dashboard > Table Editor
   - View data
   - Edit records
   - Check relationships

4. **Auth**: Dashboard > Authentication
   - View users
   - Check sessions
   - Manage policies

---

## 🆘 Emergency Procedures

### If Demo Completely Fails

1. **Show Supabase Dashboard**
   - Walk through database schema
   - Show data in tables
   - Explain architecture

2. **Show Code**
   - Open Edge Functions
   - Explain business logic
   - Show React components

3. **Use Screenshots/Video**
   - Have backup screenshots
   - Pre-recorded demo video
   - Slide deck with mockups

4. **Explain Architecture**
   - Draw diagram
   - Explain tech stack
   - Discuss scalability

---

## 📞 Getting Help

### Resources

1. **Supabase Docs**: https://supabase.com/docs
2. **React Docs**: https://react.dev
3. **Tailwind Docs**: https://tailwindcss.com/docs

### Support Channels

1. **Supabase Discord**: https://discord.supabase.com
2. **Stack Overflow**: Tag `supabase`
3. **GitHub Issues**: Check project issues

### Logs to Check

1. Browser Console (F12)
2. Network Tab (F12 > Network)
3. Supabase Dashboard > Logs
4. Edge Function Logs
5. Database Logs

---

## ✅ Prevention Checklist

**Before Demo:**
- [ ] Test all features work
- [ ] Check all credentials
- [ ] Verify environment variables
- [ ] Test on target device
- [ ] Check internet connection
- [ ] Have backup plan ready

**During Demo:**
- [ ] Start with fresh browser
- [ ] Clear cache if needed
- [ ] Have admin credentials ready
- [ ] Keep console open (hidden)
- [ ] Have this guide open

**After Demo:**
- [ ] Note any issues
- [ ] Fix bugs found
- [ ] Update documentation
- [ ] Improve error handling

---

**Remember: Most issues can be fixed by:**
1. Checking browser console
2. Verifying environment variables
3. Restarting dev server
4. Clearing browser cache
5. Checking Supabase dashboard

**Stay calm and debug systematically!** 🔧
