# thecueRoom V2 - Project Memory

## Overview
thecueRoom V2 is a production-grade monorepo application that aims to be the central hub for music news, creative AI tools, and community interaction. It is being rebuilt from V1, migrating from Firebase to Supabase+Drizzle ORM, with a focus on modern UI/UX and advanced features. The project will offer worldwide music news feeds, AI-powered creative tools (Cover Art, EPK, Meme, Avatar generators), and community features like forums, a Gig Radar, and curated music playlists. The business vision is to create a comprehensive platform for musicians and music enthusiasts.

## User Preferences
- **MUST preserve V1 branding**: Logo, colors (#0B0B0B, #D7FF3C, #9B5CFF), Inter font
- **Advanced modern UI/UX**: Production-grade, fast, responsive
- **Feed requirements**: Title, summary, thumbnails, external links, tags, FAST loading
- **Admin Access Email**: dejayillegal@gmail.com
- **Feature Priorities**:
    1. Worldwide Music News Feeds - Global coverage with fast loading
    2. AI Creative Tools - Cover Art, EPK, Meme, Avatar generators
    3. Community Features - Forum, Gig Radar, Weekly Playlists
    4. Admin Console - Content management and moderation

## System Architecture
The project utilizes a pnpm monorepo structure with `apps/web` for the Next.js frontend and `packages/db`, `packages/ai-adapters`, `packages/shared` for shared code.

**UI/UX Decisions:**
- **Branding:** Preserves V1 branding including the logo, specific color palette (#0B0B0B, #D7FF3C lime, #9B5CFF purple), and Inter font.
- **Design:** Focus on an advanced, modern, production-grade, fast, and responsive user interface.
- **Feed Display:** Feeds must include title, summary, thumbnails, external links, and tags, with an emphasis on fast loading.
- **Dashboard UI:** Updated to match pixel-perfect references, featuring a transparent header with a purple/green gradient, refined sidebar styling with yellow active state, and consistent card styling without borders.
- **News Section UI (October 2025):** 
  - 2-column responsive grid layout for improved readability
  - Always-visible metadata (title, date, summary, tags) without hover requirement
  - Lime green (#D7FF3C) hover effect with underline decoration on titles
  - Advanced category filtering with expand/collapse functionality
  - Sharp-edged transparent filter tags with lime green borders
  - Infinite scroll with cursor-based pagination

**Technical Implementations:**
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS.
- **Backend:** Next.js API routes.
- **Database ORM:** Drizzle ORM for schema definition and migrations.
- **AI Integration:** OpenAI GPT-5 (text) and OpenAI DALL-E (images) are primary AI providers, with local Canvas fallback for image generation. An AI adapter pattern is used for multi-provider support and graceful degradation.
- **Feed API:** Endpoints for feeds and sources with pagination and caching for performance.
- **AI Cover Art Studio:** Features 10 professional SVG presets and multi-provider AI integration (Hugging Face Stable Diffusion XL, Google Gemini, SVG fallback). AI jobs are processed via a Background Worker with automated cleanup.
- **AI EPK Generator:** Production-ready implementation using OpenAI GPT-5 (released August 7, 2025) for professional text generation. Features include:
  - **Separate AI Actions**: Bio generation, bio improvement, press quote generation, and tech rider generation with independent loading states
  - **Smart Fallback**: Automatic fallback to template-based text when API unavailable or returns empty content
  - **API Validation**: All endpoints validate responses for non-empty content before sending to client
  - **Dual Interface**: Simple EPKEditor at `/ai/epk-generator` for quick generation, advanced EPKStudio at `/epk` for drag-and-drop customization
  - **PDF Export**: Professional PDF generation with social platform integration
  - **Backward Compatible**: Maintains compatibility with existing EPKStudio through rewrite endpoint
- **Performance:** Includes fixes for memory leaks, TypeScript strict mode errors, optimized image loading with `Next.js Image` component, and robust WebSocket handling.
  - **Background Worker Optimization (October 2025):** Parallel processing of 5 RSS sources simultaneously (reduced ingestion time from ~15s to ~13s for 25 sources)
  - **Webpack Optimization (October 2025):** Filesystem caching, deterministic module IDs, and optimized code splitting for faster development builds

**Feature Specifications:**
- **Monorepo Architecture:** pnpm workspace with `apps/web`, and `packages/db`, `packages/ai-adapters`, `packages/shared`.
- **Database Schema:** Comprehensive Drizzle ORM schema for users, profiles, feeds, sources, spotlights, gigs, forums, EPKs, and AI jobs.
- **News Sources:** Over 60 worldwide news sources categorized by Scene, Industry, Gear, Regional, Features, EDM, and Community.
- **AI Creative Tools:** AI Cover Art Studio, AI EPK Generator, and planned Meme and Avatar Generators.
- **Authentication (October 2025):** 
  - Custom tab-based authentication modal (Sign In, Sign Up, Forgot Password)
  - Modern UI with OAuth placeholders (Email Link, Google, Apple)
  - bcrypt password hashing for security
  - Email verification system with verification modal
  - Admin role system (admin email: dejayillegal@gmail.com)
  - IP-based rate limiting on forgot-password endpoint (3 requests per 15 minutes)
  - Consistent error handling across all auth endpoints
  - Database-backed user management with Drizzle ORM
  - TODO: Email service integration for password reset and verification emails
- **Admin Console:** Planned for content management and moderation.

**System Design Choices:**
- **Deployment:** Replit for development, production deployment TBD.
- **Scalability:** Cursor-based pagination implemented for API performance.
- **Modularity:** AI adapter pattern for flexible AI service integration.
- **Security:** 
  - bcrypt password hashing (10 rounds)
  - IP-based rate limiting on sensitive endpoints
  - Admin credentials: dejayillegal@gmail.com / Closer@82
  - Consistent error responses to prevent information leakage
  - Email enumeration protection on forgot-password flow

## External Dependencies
- **Database:** PostgreSQL (via Supabase)
- **AI Services:**
    - OpenAI GPT-5 (text generation)
    - OpenAI DALL-E (image generation)
    - Hugging Face Stable Diffusion XL (image generation for Cover Art Studio)
    - Google Gemini (image generation for Cover Art Studio)
- **Deployment Platform:** Replit