# Luke Finance App

## Overview

Luke is a personal finance management mobile web application designed for German-speaking users. The app helps users gain financial clarity by tracking subscriptions, managing buy-now-pay-later services like Klarna, building emergency funds, and achieving savings goals. The app features a multi-step onboarding flow and user authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with React plugin

The frontend follows a page-based structure with reusable UI components. Pages are organized in `client/src/pages/` and include Welcome, SignUp, and multi-step Onboarding flows. The design targets mobile viewports (min-width 390px, min-height 844px).

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build**: esbuild for production bundling
- **Development**: tsx for hot-reloading during development

The server uses a modular structure with routes defined in `server/routes.ts` and storage abstraction in `server/storage.ts`. The storage layer uses an interface pattern allowing easy swapping between in-memory storage and database implementations.

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (via Neon serverless driver)
- **Schema**: Defined in `shared/schema.ts` using Drizzle's pgTable
- **Migrations**: Drizzle Kit for schema management (`db:push` command)
- **Validation**: Zod schemas generated from Drizzle tables via drizzle-zod

Current schema includes a users table with id (UUID), username, and password fields. The storage interface supports in-memory storage as a fallback when the database is not configured.

### Code Sharing
The `shared/` directory contains code used by both frontend and backend, including database schemas and type definitions. Path aliases (`@shared/*`) enable clean imports across the codebase.

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `@neondatabase/serverless`
- **Connection**: Configured via `DATABASE_URL` environment variable
- **Session Storage**: `connect-pg-simple` for Express session management

### UI Libraries
- **Radix UI**: Full suite of accessible, unstyled primitives
- **Lucide React**: Icon library
- **React Icons**: Additional icon sets (Google, Apple icons for auth buttons)
- **Embla Carousel**: Carousel/slider functionality
- **Recharts**: Charting library for data visualization
- **Vaul**: Drawer component
- **cmdk**: Command palette component

### Form Handling
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Zod integration for validation
- **Zod**: Schema validation

### Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner for Replit environment
- **TypeScript**: Strict mode enabled with bundler module resolution