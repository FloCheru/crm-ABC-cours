# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + TypeScript + Vite)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (includes TypeScript compilation)
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

### Backend (Node.js + Express + MongoDB)
- `cd backend && npm run dev` - Start backend development server with nodemon
- `cd backend && npm start` - Start backend in production mode
- `cd backend && npm test` - Run Jest test suite
- `cd backend && npm run test:watch` - Run tests in watch mode
- `cd backend && npm run test:coverage` - Run tests with coverage report

### Database Management
- `cd backend && npm run seed` - Seed entire database
- `cd backend && npm run seed:subjects` - Seed subjects only
- `cd backend && npm run seed:users` - Seed users only

## Architecture Overview

This is a full-stack CRM application for ABC Cours, an educational institution management system.

### Project Structure
- **Frontend**: React 19 + TypeScript + Vite in root directory
- **Backend**: Node.js + Express + MongoDB in `/backend` directory
- **Deployment**: Frontend on Vercel/GitHub Pages, Backend on Railway

### Core Domains
- **Authentication**: JWT-based auth with role-based access (admin/professor)
- **Family Management**: Students grouped by families with contact information
- **Coupon System**: Generate and track educational coupons/vouchers
- **Settlement Notes**: Financial settlement and billing management
- **Subject Management**: Course subjects and professor assignments

### Key Technologies
- **Frontend**: React 19, TypeScript, React Router, React Hook Form, Zustand, TanStack Query, Tailwind CSS
- **Backend**: Express.js, Mongoose, JWT, bcrypt, Jest for testing
- **Database**: MongoDB with Mongoose ODM

### State Management
- **Zustand**: Primary state management
- **TanStack Query**: Server state and caching
- **RefreshContext**: Global refresh coordination

### Component Architecture
- **Reusable Components**: Located in `src/components/` with modular CSS
- **Entity Forms**: Generic form system in `components/forms/EntityForm/`
- **Pages**: Route components in `src/pages/` organized by feature areas
- **Services**: API layer in `src/services/` with typed interfaces

### Backend Architecture
- **Routes**: RESTful API endpoints in `/backend/routes/`
- **Models**: Mongoose schemas in `/backend/models/`
- **Middleware**: Authentication and validation in `/backend/middleware/`
- **Services**: Business logic in `/backend/services/`

### Environment Configuration
- **Development**: Uses `.env.development` for backend
- **Production**: Uses `.env.production` for backend
- **Frontend Proxy**: Vite proxies `/api` requests to backend during development

### Testing Strategy
- **Backend**: Jest with MongoDB Memory Server for integration tests
- **Test Files**: Located in `/backend/tests/`
- **Coverage**: Use `npm run test:coverage` to generate reports

### Build and Deployment Notes
- **Frontend**: Builds to `/dist` with manual chunk splitting for optimization
- **Base Path**: Production builds use `/crm-ABC-cours/` base path for GitHub Pages
- **API Proxy**: Frontend proxies API calls to backend URL via environment variables
- **CORS**: Backend configured for localhost development and production domains