# Real-time Features Documentation

## 🔴 Live Updates with Supabase Realtime

Our booking system uses Supabase Realtime to provide instant updates across all connected clients. Here's how it works:

## 📡 Implemented Real-time Subscriptions

### 1. Booking Calendar Real-time Updates
**File**: `frontend/src/components/BookingCalendar.tsx`

```typescript
useEffect(() => {
  const channel = supabase
    .channel('bookings-changes')
    .on(
      'postgres_changes',
      {
        event: '*',  // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'bookings',
        filter: `booking_date=eq.${selectedDate.toISOString().split('T')[0]}`,
      },
      () => {
        fetchBookings()  // Refresh bookings when any change occurs
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)  // Cleanup on unmount
  }
}, [selectedDate])
```

**What it does:**
- Listens for any changes to bookings on the selected date
- Automatically refreshes the calendar when someone books/cancels
- Updates slot colors (green → red) instantly
- Works across multiple browser tabs/devices

**User experience:**
- User A books a slot → User B sees it turn red immediately
- No need to refresh the page
- Always shows accurate availability

### 2. User Dashboard Real-time Updates
**File**: `frontend/src/pages/DashboardPage.tsx`

```typescript
useEffect(() => {
  if (!user) return

  const channel = supabase
    .channel('user-bookings')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${user.id}`,
      },
      () => {
        fetchBookings()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user])
```

**What it does:**
- Listens for changes to the current user's bookings only
- Updates upcoming and past bookings lists
- Reflects cancellations immediately
- Shows status changes in real-time

**User experience:**
- Cancel a booking → It moves to past bookings instantly
- Admin cancels your booking → You see it immediately
- Status changes (confirmed → cancelled) update live

### 3. Admin Dashboard Real-time Updates
**File**: `frontend/src/pages/AdminDashboard.tsx`

```typescript
useEffect(() => {
  if (!isAdmin) return

  const channel = supabase
    .channel('admin-bookings')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
      },
      () => {
        fetchBookings()
        fetchStats()  // Also update statistics
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [isAdmin])
```

**What it does:**
- Listens for ALL booking changes (no filter)
- Updates the bookings table in real-time
- Refreshes statistics (total bookings, revenue, etc.)
- Shows new bookings as they come in

**User experience:**
- New booking appears in table immediately
- Statistics update live
- Payment status changes reflect instantly
- Multi-admin support (all admins see same data)

## 🎯 Real-time Event Types

Supabase Realtime supports these event types:

| Event | Description | When it fires |
|-------|-------------|---------------|
| `INSERT` | New row added | User creates a booking |
| `UPDATE` | Row modified | Booking status changes, marked as paid |
| `DELETE` | Row removed | Booking deleted (rare) |
| `*` | All events | Any change to the table |

## 🔧 How It Works

### Architecture
```
User Action (Book/Cancel)
    ↓
Supabase Database (INSERT/UPDATE)
    ↓
Supabase Realtime (Broadcast change)
    ↓
All Connected Clients (Receive update)
    ↓
React Components (Re-fetch data)
    ↓
UI Updates (Show new state)
```

### Performance Considerations

1. **Efficient Filtering**: We use filters to only listen to relevant changes
   - Booking calendar: Only bookings for selected date
   - User dashboard: Only current user's bookings
   - Admin dashboard: All bookings (necessary for admin)

2. **Automatic Cleanup**: Subscriptions are cleaned up when components unmount
   ```typescript
   return () => {
     supabase.removeChannel(channel)
   }
   ```

3. **Debouncing**: Supabase handles debouncing internally to prevent excessive updates

## 🚀 Benefits

### For Users
- ✅ Always see accurate availability
- ✅ No need to refresh the page
- ✅ Instant feedback on actions
- ✅ Multi-device synchronization

### For Admins
- ✅ Monitor bookings in real-time
- ✅ See new bookings as they happen
- ✅ Live statistics updates
- ✅ Better operational awareness

### For Developers
- ✅ Simple API (just subscribe to changes)
- ✅ Automatic reconnection on network issues
- ✅ Built-in error handling
- ✅ No need for polling or WebSocket setup

## 🧪 Testing Real-time Features

### Test 1: Multi-tab Booking
1. Open app in 2 browser tabs
2. Login in both
3. Go to booking page in both
4. Book a slot in tab 1
5. **Expected**: Tab 2 shows the slot as booked immediately

### Test 2: Admin Monitoring
1. Open app in 2 tabs
2. Login as admin in tab 1 (go to /admin)
3. Login as regular user in tab 2
4. Book a slot in tab 2
5. **Expected**: Tab 1 (admin) shows the new booking immediately

### Test 3: Dashboard Updates
1. Open dashboard in one tab
2. Open booking page in another tab
3. Book a slot in booking page
4. **Expected**: Dashboard shows the new booking immediately

### Test 4: Cancellation Sync
1. Open dashboard in 2 tabs (same user)
2. Cancel a booking in tab 1
3. **Expected**: Tab 2 updates immediately

## 🔒 Security

Real-time subscriptions respect Row Level Security (RLS):
- Users can only receive updates for data they have access to
- RLS policies are enforced on real-time events
- Admin-only data is not broadcast to regular users

## 📊 Connection Status

Supabase Realtime maintains a persistent WebSocket connection:
- Automatically reconnects on network issues
- Handles authentication token refresh
- Manages connection lifecycle

## 🎨 UI Feedback

When real-time updates occur:
1. Data is fetched from Supabase
2. React state updates
3. Components re-render
4. Smooth transitions (thanks to Framer Motion)
5. No jarring changes or flickers

## 🔮 Future Enhancements

Potential real-time features to add:
- [ ] Waitlist position updates (when someone ahead cancels)
- [ ] Live facility availability counter
- [ ] Real-time notifications (toast when booking confirmed)
- [ ] Typing indicators for admin chat
- [ ] Live user count on booking page
- [ ] Real-time review updates

## 💡 Best Practices

1. **Always clean up subscriptions**
   ```typescript
   return () => supabase.removeChannel(channel)
   ```

2. **Use specific filters when possible**
   ```typescript
   filter: `user_id=eq.${user.id}`
   ```

3. **Handle loading states**
   ```typescript
   const [loading, setLoading] = useState(true)
   ```

4. **Provide user feedback**
   ```typescript
   toast.success('Booking confirmed!')
   ```

## 🐛 Troubleshooting

**Problem**: Real-time updates not working
- Check if Realtime is enabled in Supabase project settings
- Verify RLS policies allow SELECT on the table
- Check browser console for connection errors

**Problem**: Updates are slow
- Check network connection
- Verify Supabase region is close to users
- Consider using filters to reduce data transfer

**Problem**: Multiple updates firing
- This is normal - Supabase may send multiple events
- Our code handles this by re-fetching data

## 📚 Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [RLS with Realtime](https://supabase.com/docs/guides/realtime/authorization)

---

**Note**: All real-time features are production-ready and working! Test them out by opening multiple browser tabs. 🚀
