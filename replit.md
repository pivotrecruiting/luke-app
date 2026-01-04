# Luke Finance App

## Overview

Luke is a personal finance management mobile application built with React Native and Expo, designed for German-speaking users. The app helps users gain financial clarity through an intuitive onboarding flow that collects information about savings goals, income sources, and monthly expenses. The application follows a mobile-first design approach with support for iOS, Android, and web platforms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript with strict mode enabled
- **Navigation**: React Navigation v7 with native stack navigators
- **State Management**: TanStack React Query for server state caching
- **Animations**: React Native Reanimated for smooth, performant animations
- **Styling**: StyleSheet-based approach with a centralized theme system (`client/constants/theme.ts`)
- **Image Handling**: expo-image for optimized image loading

The frontend uses a layered navigation structure:
- `RootStackNavigator` serves as the top-level navigator
- `OnboardingNavigator` handles the multi-step onboarding flow (Welcome → SignUp → 5 onboarding screens)

Path aliases are configured via babel module-resolver:
- `@/` → `./client`
- `@shared/` → `./shared`
- `@assets/` → `./assets`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Development**: tsx for hot-reloading during development
- **Production Build**: esbuild for bundling

The server follows a modular structure:
- `server/index.ts` - Express app setup with CORS and body parsing
- `server/routes.ts` - API route registration (all routes prefixed with `/api`)
- `server/storage.ts` - Storage abstraction layer with interface pattern

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured via `DATABASE_URL` environment variable)
- **Schema Location**: `shared/schema.ts`
- **Validation**: Zod schemas generated from Drizzle tables via drizzle-zod
- **Fallback**: In-memory storage (`MemStorage`) when database is not configured

Current schema includes a users table with id (UUID), username, and password fields.

### Code Sharing
The `shared/` directory contains code used by both frontend and backend:
- Database schemas and type definitions
- Zod validation schemas

### Design System
The app uses a comprehensive theme system defined in `client/constants/theme.ts`:
- Light and dark color schemes
- Consistent spacing, border radius, and typography scales
- Finance-focused color palette with purple primary (#7340fd) and lavender accent (#7B8CDE)

Reusable components include:
- `Button`, `Card`, `Chip` - Core UI elements with animation support
- `ThemedText`, `ThemedView` - Theme-aware base components
- `ProgressDots`, `CurrencyInput` - Onboarding-specific components
- `ErrorBoundary`, `ErrorFallback` - Error handling components

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `pg` package
- **Connection**: Configured via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM for type-safe database operations

### Expo Modules
- `expo-image` - Optimized image loading
- `expo-linear-gradient` - Gradient backgrounds
- `expo-haptics` - Haptic feedback
- `expo-blur`, `expo-glass-effect` - Visual effects
- `expo-splash-screen` - App splash screen
- `expo-web-browser` - In-app browser

### UI & Animation
- `react-native-reanimated` - High-performance animations
- `react-native-gesture-handler` - Touch gesture handling
- `react-native-safe-area-context` - Safe area insets
- `react-native-screens` - Native screen containers
- `react-native-keyboard-controller` - Keyboard-aware scrolling
- `@expo/vector-icons` - Icon library (Feather icons used)

### Networking
- `@tanstack/react-query` - Server state management and caching
- API requests go through `client/lib/query-client.ts`

### Development
- Babel with module-resolver for path aliases
- ESLint with Expo and Prettier configurations
- TypeScript for type safety