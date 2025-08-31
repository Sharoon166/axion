# Project Structure & Development Guidelines

This document outlines the folder structure and coding guidelines for maintaining a scalable, type-safe, and industry-standard codebase.

---

## 📂 Folder Structure

```
project-root/
│
├── src/
│   ├── app/                      # Next.js App Router (routes, layouts, metadata)
│   │   ├── (public)/             # Public-facing routes
│   │   ├── (auth)/               # Authentication-related routes (login, register, etc.)
│   │   ├── (dashboard)/          # Protected routes for logged-in users
│   │   ├── api/                  # Route handlers (Next.js API or tRPC endpoints)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Base UI components (shadcn/ui, buttons, inputs, etc.)
│   │   └── common/               # Shared components across the app (Navbar, Footer, etc.)
│   │
│   ├── features/                 # Feature modules containing domain logic + UI
│   │   └── feature-name/
│   │       ├── components/       # UI for the feature
│   │       ├── hooks/            # Custom hooks for the feature
│   │       ├── services/         # API calls or server actions for this feature
│   │       └── types.ts          # Types for the feature
│   │
│   ├── lib/                       # Utility functions, config, and helpers
│   │   ├── db/                   # Database connection logic
│   │   ├── auth/                 # Better-Auth setup and helpers
│   │   ├── validations/          # Zod schemas for validation
│   │   ├── logger.ts             # Logging utility
│   │   └── utils.ts              # Generic helper functions
│   │
│   ├── models/                   # Mongoose models
│   │   └── User.ts
│   │
│   ├── services/                 # Business logic not tied to UI (e.g., email sending)
│   │   ├── userService.ts
│   │   └── postService.ts
│   │
│   ├── store/                    # Zustand or global state management
│   │   └── useUserStore.ts
│   │
│   ├── styles/                   # Global CSS/Tailwind config
│   │   └── globals.css
│   │
│   ├── types/                    # Global TypeScript types
│   │   └── index.d.ts
│   │
│   └── middleware.ts             # Next.js middleware (auth checks, logging, etc.)
│
├── public/                       # Static files (images, icons, etc.)
│
├── .env                          # Environment variables
├── .env.example                  # Example env variables for onboarding
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── postcss.config.js
```
