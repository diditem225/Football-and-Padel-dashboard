# Sports Complex Booking System 🏟️⚽🎾

A modern, full-stack web application for managing bookings at a sports complex in Tunisia featuring **6 football fields** and **2 padel courts**. Built with React, TypeScript, Tailwind CSS, and Supabase.

> **🚀 DEMO VERSION READY!** See [DEMO_README.md](./DEMO_README.md) for quick setup (30 minutes to working demo)

## ✨ Features

### 🚀 Quick Start (Demo Version)

**Get a working demo in 30 minutes:**

1. **Deploy Backend:**
   ```bash
   # Windows
   deploy-demo.bat
   
   # Mac/Linux
   ./deploy-demo.sh
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   npm run dev
   ```

3. **Test:** Open http://localhost:3000 and create a booking!

📖 **Full Setup Guide:** [DEMO_SETUP.md](./DEMO_SETUP.md)

### 🎯 Core Functionality
- **Hourly Booking System** - Book facilities by the hour with real-time availability
- **Recurring Bookings** - Schedule weekly recurring reservations
- **Smart Waitlist** - Join waitlists with automatic slot offering and cascading logic
- **No-Show Tracking** - Automatic detection and user restrictions for no-shows
- **Email Notifications** - Confirmation, reminders, and waitlist offers via SendGrid
- **Review System** - Rate and review facilities after sessions

### 🎨 User Experience
- **Modern Animated UI** - Framer Motion animations and smooth transitions
- **Light/Dark Mode** - Optimized for outdoor mobile use
- **Real-time Updates** - Live availability and waitlist position updates
- **Responsive Design** - Mobile-first design with touch-optimized controls
- **Glass-morphism Effects** - Beautiful modern UI with football green and padel blue themes

### 👨‍💼 Admin Features
- **Dashboard** - Comprehensive statistics and facility management
- **Booking Management** - Mark payments, cancel bookings, view all reservations
- **User Management** - View no-show history and manage restrictions
- **Revenue Tracking** - Monitor bookings, revenue, and facility utilization

## 🏗️ Technology Stack

### Frontend
- **React 18+** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Zustand** for state management
- **React Query** for data fetching and caching
- **Supabase JS Client** for backend integration

### Backend (Supabase)
- **Supabase Database** - Managed PostgreSQL 15+
- **Supabase Auth** - JWT-based authentication
- **Supabase Edge Functions** - Deno/TypeScript serverless functions
- **Supabase Realtime** - WebSocket-based live updates
- **Row Level Security (RLS)** - Database-level access control
- **pg_cron** - Scheduled tasks for reminders and no-show checks

### External Services
- **SendGrid** - Email notifications
- **Vercel/Netlify** - Frontend hosting

## 📁 Project Structure

```
sports-complex-booking/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Supabase client and utilities
│   │   ├── stores/          # Zustand state stores
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json
│
├── supabase/                # Supabase configuration
│   ├── functions/           # Edge Functions (Deno/TypeScript)
│   │   ├── create-booking/
│   │   ├── cancel-booking/
│   │   ├── waitlist-cascade/
│   │   ├── no-show-tracker/
│   │   └── send-email/
│   ├── migrations/          # Database migrations
│   └── config.toml          # Supabase configuration
│
├── .kiro/                   # Kiro spec files
│   └── specs/
│       └── sports-complex-booking-system/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase CLI** - [Installation Guide](https://supabase.com/docs/guides/cli)
- **Supabase Account** - [Sign up](https://supabase.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sports-complex-booking
   ```

2. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Set up Supabase**
   ```bash
   # Login to Supabase
   supabase login

   # Link to your Supabase project
   supabase link --project-ref your-project-ref

   # Push database migrations
   supabase db push

   # Deploy Edge Functions
   supabase functions deploy
   ```

5. **Configure environment variables**
   
   Create `frontend/.env.local`:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

6. **Start development server**
   ```bash
   cd frontend
   npm run dev
   ```

   Visit `http://localhost:5173`

## 🧪 Testing

### Property-Based Testing
```bash
npm run test:property
```

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 📦 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Supabase Edge Functions
```bash
supabase functions deploy --project-ref your-project-ref
```

## 🎯 Key Business Rules

- **Cancellation Window**: 96 hours before booking
- **Claim Window**: 12 hours to claim waitlist offers
- **No-Show Grace Period**: 15 minutes after session start
- **No-Show Threshold**: 2 no-shows in 30 days = 14-day restriction
- **Football Fields**: Require 14 players minimum
- **Padel Courts**: No player restrictions

## 🔐 Security

- **Row Level Security (RLS)** - Database-level access control
- **JWT Authentication** - Secure token-based auth via Supabase
- **Input Validation** - Zod schemas for all Edge Functions
- **Rate Limiting** - Protection against abuse
- **HTTPS Only** - Secure communication in production

## 📚 Documentation

- [Requirements Document](.kiro/specs/sports-complex-booking-system/requirements.md)
- [Design Document](.kiro/specs/sports-complex-booking-system/design.md)
- [Implementation Tasks](.kiro/specs/sports-complex-booking-system/tasks.md)

## 🤝 Contributing

This is a private project for a sports complex in Tunisia. For questions or support, please contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com)
- UI inspired by modern sports booking platforms
- Animations powered by [Framer Motion](https://www.framer.com/motion/)

---

**Made with ⚽ and 🎾 for sports enthusiasts in Tunisia**
