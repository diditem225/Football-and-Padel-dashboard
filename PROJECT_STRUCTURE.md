# Project Structure Overview

This document provides an overview of the Sports Complex Booking System project structure.

## Root Directory

```
sports-complex-booking-system/
├── backend/                    # Python FastAPI backend
├── frontend/                   # React TypeScript frontend
├── .dockerignore              # Docker ignore patterns
├── .gitignore                 # Git ignore patterns
├── docker-compose.yml         # Docker orchestration
├── README.md                  # Project documentation
└── PROJECT_STRUCTURE.md       # This file
```

## Backend Structure

```
backend/
├── alembic/                   # Database migrations
│   ├── versions/              # Migration files
│   ├── env.py                 # Alembic environment
│   └── script.py.mako         # Migration template
├── app/
│   ├── api/                   # API endpoints
│   │   └── v1/                # API version 1
│   ├── core/                  # Core configuration
│   │   ├── config.py          # Application settings
│   │   └── security.py        # Security utilities
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # Business logic
│   └── main.py                # FastAPI application
├── scripts/                   # Utility scripts
├── tests/                     # Backend tests
├── .dockerignore              # Docker ignore
├── .env.example               # Environment template
├── .gitignore                 # Git ignore
├── alembic.ini                # Alembic configuration
├── Dockerfile                 # Backend Docker image
├── pyproject.toml             # Python project config
├── pytest.ini                 # Pytest configuration
└── requirements.txt           # Python dependencies
```

## Frontend Structure

```
frontend/
├── public/                    # Static assets
├── src/
│   ├── components/            # React components
│   ├── pages/                 # Page components
│   ├── services/              # API services
│   ├── stores/                # Zustand state stores
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Utility functions
│   ├── App.tsx                # Root component
│   ├── index.css              # Global styles
│   ├── main.tsx               # Application entry
│   └── vite-env.d.ts          # Vite types
├── .dockerignore              # Docker ignore
├── .eslintrc.cjs              # ESLint configuration
├── .gitignore                 # Git ignore
├── Dockerfile                 # Frontend Docker image
├── index.html                 # HTML template
├── package.json               # Node dependencies
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # Tailwind CSS config
├── tsconfig.json              # TypeScript config
├── tsconfig.node.json         # TypeScript node config
└── vite.config.ts             # Vite configuration
```

## Key Configuration Files

### Backend Configuration

- **requirements.txt**: Python dependencies including FastAPI, SQLAlchemy, Pydantic, JWT, SendGrid
- **.env.example**: Template for environment variables (database, JWT, email, booking settings)
- **alembic.ini**: Database migration configuration
- **pyproject.toml**: Black, mypy, and pytest configuration
- **pytest.ini**: Test configuration

### Frontend Configuration

- **package.json**: Node dependencies including React, TypeScript, Tailwind, Framer Motion
- **vite.config.ts**: Vite development server and build configuration
- **tailwind.config.js**: Custom theme with football green and padel blue colors
- **tsconfig.json**: TypeScript compiler options
- **.eslintrc.cjs**: ESLint rules for code quality

### Docker Configuration

- **docker-compose.yml**: Orchestrates PostgreSQL, backend, and frontend services
- **backend/Dockerfile**: Python 3.11 slim image with FastAPI
- **frontend/Dockerfile**: Node 18 alpine image with Vite

## Technology Stack Summary

### Backend
- Python 3.11+
- FastAPI (web framework)
- SQLAlchemy (ORM)
- Alembic (migrations)
- PostgreSQL (database)
- Pydantic (validation)
- JWT (authentication)
- SendGrid (email)
- APScheduler (scheduled tasks)
- Hypothesis (property-based testing)

### Frontend
- React 18+
- TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Framer Motion (animations)
- React Router (navigation)
- Axios (HTTP client)
- Zustand (state management)

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 15
- Nginx (reverse proxy)

## Next Steps

1. **Backend Setup**: Install Python dependencies and configure environment variables
2. **Frontend Setup**: Install Node dependencies
3. **Database Setup**: Create PostgreSQL database and run migrations
4. **Development**: Start both backend and frontend development servers
5. **Docker Deployment**: Use docker-compose for containerized deployment

See README.md for detailed setup instructions.
