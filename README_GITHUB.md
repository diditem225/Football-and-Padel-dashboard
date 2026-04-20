# 🏟️ Sports Complex Booking System

A modern, full-stack booking system for sports facilities built with React, TypeScript, and Supabase. Features real-time updates, admin dashboard, and beautiful UI with dark mode support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green)

## ✨ Features

### 🎯 Core Features
- **Real-time Booking Calendar** - Interactive calendar with live availability updates
- **User Dashboard** - Manage bookings, view history, and track upcoming reservations
- **Admin Dashboard** - Comprehensive management tools with statistics and payment tracking
- **Authentication** - Secure user authentication with Supabase Auth
- **Contact Form** - Beautiful contact page with validation
- **Theme System** - Light/dark mode with persistent preferences

### 🚀 Technical Features
- **Real-time Updates** - Instant synchronization across all connected clients
- **Row Level Security** - Database-level security with Supabase RLS
- **Responsive Design** - Works perfectly on mobile, tablet, and desktop
- **Type Safety** - Full TypeScript coverage with generated types
- **Smooth Animations** - Beautiful transitions with Framer Motion
- **Form Validation** - Client-side validation with error handling

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Router v6** - Client-side routing
- **React Hot Toast** - Beautiful notifications

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Edge Functions (planned)

## 📦 Project Structure

```
sports-complex-booking/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts (Auth, Theme)
│   │   ├── lib/            # Utilities and configurations
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript type definitions
│   │   └── main.tsx        # Application entry point
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── supabase/               # Supabase configuration
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge Functions (planned)
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git (optional, for cloning)

### Installation

1. **Clone the repository** (or download ZIP)
   ```bash
   git clone https://github.com/YOUR_USERNAME/sports-complex-booking.git
   cd sports-complex-booking
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings → API
   - Copy your project URL and anon key

4. **Configure environment variables**
   
   Create `frontend/.env.local`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_URL=http://localhost:3000
   VITE_ENVIRONMENT=development
   VITE_CANCELLATION_WINDOW_HOURS=96
   VITE_CLAIM_WINDOW_HOURS=12
   VITE_FOOTBALL_MIN_PLAYERS=14
   ```

5. **Run database migrations**
   
   In Supabase SQL Editor, run these files in order:
   - `supabase/migrations/20240420000000_initial_schema.sql`
   - `supabase/migrations/20240420000001_rls_policies.sql`
   - `supabase/migrations/20240420000002_manual_admin_setup.sql` (update email)

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

### Tables

- **user_profiles** - Extended user information
- **facilities** - Sports facilities (6 football fields, 2 padel courts)
- **bookings** - Booking records with status tracking
- **waitlist_entries** - Waitlist management (ready for implementation)
- **reviews** - User reviews (ready for implementation)
- **no_show_records** - No-show tracking (ready for implementation)
- **email_logs** - Email notification logs (ready for implementation)

### Security

All tables use Row Level Security (RLS) policies:
- Users can only view/modify their own data
- Admins have full access to all data
- Facilities are publicly readable

## 📱 Features Overview

### For Users

1. **Browse Facilities** - View all available sports facilities
2. **Book Slots** - Select date, time, and facility
3. **Manage Bookings** - View upcoming and past bookings
4. **Cancel Bookings** - Cancel reservations
5. **Contact Support** - Send inquiries via contact form

### For Admins

1. **Dashboard Overview** - View key statistics
2. **Booking Management** - View and manage all bookings
3. **Payment Tracking** - Mark bookings as paid
4. **User Management** - View user information
5. **Real-time Monitoring** - Live updates on all bookings

## 🎨 Customization

### Theme Colors

Edit `frontend/tailwind.config.js`:

```javascript
colors: {
  football: {
    // Football green shades
    500: '#22c55e',
    600: '#16a34a',
    // ...
  },
  padel: {
    // Padel blue shades
    500: '#3b82f6',
    600: '#2563eb',
    // ...
  }
}
```

### Business Rules

Edit `frontend/.env.local`:

```env
VITE_CANCELLATION_WINDOW_HOURS=96  # Hours before booking
VITE_CLAIM_WINDOW_HOURS=12         # Waitlist claim window
VITE_FOOTBALL_MIN_PLAYERS=14       # Minimum players
```

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Tailwind CSS for styling

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set environment variables
4. Deploy!

### Database (Supabase)

1. Review RLS policies
2. Configure production backups
3. Set up monitoring
4. Deploy Edge Functions (when ready)

## 📝 Environment Variables

### Required

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Optional

- `VITE_APP_URL` - Application URL (default: http://localhost:3000)
- `VITE_ENVIRONMENT` - Environment (development/production)
- `VITE_CANCELLATION_WINDOW_HOURS` - Cancellation window (default: 96)
- `VITE_CLAIM_WINDOW_HOURS` - Waitlist claim window (default: 12)
- `VITE_FOOTBALL_MIN_PLAYERS` - Minimum players (default: 14)

## 🐛 Troubleshooting

### "Failed to load facilities"

Run this in Supabase SQL Editor:
```sql
ALTER TABLE public.facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
```

### "Not authenticated"

Make sure you're logged in and your user profile exists in `user_profiles` table.

### Build errors

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [React](https://react.dev) - UI framework

## 📧 Contact

For questions or support, please use the contact form in the application or open an issue on GitHub.

---

**Built with ❤️ using React, TypeScript, and Supabase**
