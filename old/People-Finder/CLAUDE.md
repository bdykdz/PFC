# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

People-Finder is a professional profile management system built with Next.js 15 and Firebase. It manages employee profiles, contracts, qualifications, and skills with advanced search capabilities.

## Key Technologies

- **Framework**: Next.js 15.0.3 with App Router and Turbopack
- **Language**: TypeScript with strict mode
- **Authentication**: Firebase Auth with server-side session cookies
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **UI**: Shadcn/ui (New York style) with Radix UI primitives
- **Styling**: Tailwind CSS with dark mode support via next-themes

## Development Commands

```bash
npm run dev    # Start development server with Turbopack
npm run build  # Build for production
npm run start  # Start production server
npm run lint   # Run ESLint
npm run seed   # Run database seed script (Note: script file missing at /src/scripts/seed.ts)
```

## Environment Variables Required

### Client-side Firebase Config (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Server-side Firebase Admin
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

## Architecture Overview

### Authentication Flow
1. **Client Login**: Uses Firebase Auth SDK with email/password
2. **Session Creation**: ID token exchanged for HTTP-only session cookie via `/api/auth/session`
3. **Route Protection**: Middleware validates session cookies for protected routes
4. **Session Duration**: 5 days with secure cookie settings

### Route Structure
- `/(auth)/`: Public routes (login)
- `/(protected)/`: Authenticated routes (profile, search, add-person, edit-profile)
- `/api/`: API routes for session management

### Key Files
- `src/middleware.ts`: Route protection logic
- `src/lib/firebase.ts`: Client-side Firebase initialization
- `src/lib/firebase-admin.ts`: Server-side Firebase Admin
- `src/contexts/AuthContext.tsx`: Client authentication state management
- `src/lib/auth-utils.ts`: Authentication helper functions
- `src/types/index.ts`: TypeScript type definitions

## Data Models

- **User**: Professional profile with contract type (CIM/PFA/SRL)
- **Contract**: Work agreements with document attachments
- **Diploma**: Educational credentials with documents
- **Skill**: Technical/soft skills with proficiency levels
- **Document**: File references for contracts/diplomas

## Development Guidelines

### When adding new features:
1. Follow existing patterns for Firebase queries in lib/firebase-queries.ts
2. Use server-side session validation for protected API routes
3. Maintain TypeScript strict mode compliance
4. Use Shadcn/ui components from src/components/ui/
5. Follow existing Tailwind CSS patterns with CSS variables for theming

### Common Patterns:
- Authentication checks: Use middleware for route protection
- Firebase queries: Batch reads when possible for performance
- File uploads: Store in Firebase Storage, save references in Firestore
- Form handling: Use controlled components with TypeScript interfaces
- Error handling: Display user-friendly messages, log details server-side

### Project Structure:
```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # Reusable UI components
├── contexts/      # React contexts (AuthContext)
├── lib/          # Utilities, Firebase setup, helper functions
├── types/        # TypeScript type definitions
└── middleware.ts # Route protection
```

## Notes

- The project appears to serve Romanian users (contract types, skill terms in Romanian)
- No testing framework is currently set up
- The seed script referenced in package.json is missing
- Uses Turbopack for faster development builds
- ESLint is configured but disabled during production builds