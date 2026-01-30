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
  - **Background Worker Optimization (January 2026):** Fixed column name errors and schema mismatches in background feed worker.
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
  - **Bug Fix (October 31, 2025):** Fixed InfoModal auto-showing on page load - added conditional rendering to prevent Terms modal from appearing when not triggered by user action
  - **Username Generation (October 31, 2025):** Enhanced with 60+ underground music-themed suffixes across categories: underground culture (.mastercue, .vinylhead, .selector), genres (.subsonic, .bassline, .breakbeat), production (.beatsmith, .layerking), DJ culture (.waveform, .platter), modern styles (.trap808, .bassface). Varied format patterns for uniqueness.
  - **Password Complexity (October 31, 2025):** Minimum 8 characters with visual strength indicator (red=Bad <8 chars, yellow=Weak 8-11 chars, green=Strong 12+ with variety). Progressive scoring based on length and character types.
  - **Cold Start Account Seeding (January 2026):** Deterministic initialization system for guaranteed account creation:
    * Bootstrap runs automatically on Next.js server startup via instrumentation hook
    * Admin account (dejayillegal@gmail.com) + 2 test accounts created on every cold start
    * Idempotent logic: creates if missing, updates role/verified status if needed
    * Password hashes refreshed on each boot for consistency
    * Graceful handling when database tables don't exist yet
    * Located at `apps/web/lib/bootstrap/seed-accounts.ts`
  - **Centralized Email Validation (January 2026):** Unified email validation across all auth flows:
    * Single source of truth at `apps/web/lib/validation/email.ts`
    * Consistent validation in login, registration, and password recovery
    * RFC-compliant email regex with proper normalization
    * Updated auth routes to use bcryptjs consistently
  - TODO: Email service integration for password reset and verification emails
- **Artist Social UI (January 2026):**
  - Artist-only social layer derived from existing data (no new tables)
  - **Routes:**
    * `/artist` - Artist social directory with feed (artist/admin only)
    * `/artist/u/[username]` - Individual artist profile page by username
    * `/link/[username]` - Public bio link page (Milkshake-style)
  - **Following System:** Stored in profile metadata (`socialLinks._following` array)
    * Follow/unfollow via `/api/artist/follow` (POST/DELETE)
    * Followers count derived by reverse lookup
    * Feed filters to show content from followed artists
  - **Features:**
    * Profile viewing with stats (signals, followers, following, karma)
    * Recent activity (threads, replies) from forum data
    * Social links display from profile metadata
    * Own profile shows "Edit Profile" button, others show "Follow" button
    * Shareable bio link pages for external promotion
    * Artist preview cards on hover/tap
  - **Access Control:** Restricted to artist and admin roles
  - **Components:** ArtistProfileClient, ArtistPreviewCard, bio link page
- **Profile Settings (October 31, 2025):**
  - Comprehensive profile management page at `/settings`
  - Read-only fields: email, username, artistName, verified social links (protected after verification)
  - Editable fields: displayName, firstName, lastName, bio, phone, region, genre, privacy settings
  - API endpoints: GET `/api/profile` (fetch), PATCH `/api/profile` (update) with authentication
  - Live save feedback with loading states
  - Proper validation and error handling
- **AI Verification System (January 2026):**
  - **Background Worker (January 2026):** Automated verification worker for fake account detection and artist verification.
  - Advanced fake account detection with 15+ sophisticated checks:
    * Disposable email patterns (10minutemail, guerrillamail, tempmail, etc.)
    * Keyboard spam detection (qwerty, asdf patterns)
    * URL shortener/invalid domain detection (bit.ly, t.co, tinyurl)
    * Deleted/suspended profile indicators ("not found", "suspended", "deleted")
    * Bot-like username patterns (bot123, test_user, random characters)
    * Generic profile detection (identical first/last name, empty bios)
    * Music content validation (track counts, follower ratios)
  - Comprehensive duplicate detection (email, artist name, social URL exact and normalized)
  - Suspicion scoring system (threshold: 40+ = rejected)
  - Multi-factor analysis combining profile completeness, social presence, and authenticity
- **Community Forum (November 2025 - January 2026):**
  - **Database Schema (Nov 3):** Enhanced with 4 new tables for advanced features:
    * `thread_drafts` - Autosave functionality for thread composition
    * `mentions` - @mention tracking and notifications
    * `thread_followers` - Thread subscription system
    * `moderation_queue` - AI-powered moderation workflow
    * Added `visibility` field to `forum_threads` (public/members/private)
  - **Validation Schemas (Nov 3):** Comprehensive Zod schemas for all forum operations in `packages/shared/forumSchemas.ts`
  - **UI Components (Nov 3):** Pixel-perfect dark theme with lime-green (#D7FF3C) accents:
    * ForumList - Responsive 3-column layout (categories, threads, sidebar)
    * ThreadView - Thread detail page with verified badges, upvotes, thread info sidebar
    * ThreadComposer - Create form with toolbar (Mention, Link, Media, AI Draft) and settings sidebar
    * ThreadAssistModal - AI suggestion modal with tone selectors and safety toggles
    * ProfileModal - User profile with stats, badges, activity feed, and quick mention composer
  - **Features Implemented:** Category filtering, thread sorting, verified artist badges, upvote system, visibility controls
  - **Forum Content Seeding (January 2026):** Automatic forum content seeding on cold start:
    * 5 categories: General Discussion, Production Tips, Collaborations, Industry News, Feedback & Reviews
    * 6 sample threads with pre-approved moderation status for immediate display
    * Located at `apps/web/lib/bootstrap/seed-forum.ts`
  - **Mobile Responsiveness (January 2026):** Full mobile support for forum components:
    * ForumList: Collapsible mobile menu for categories, responsive header with New Thread button
    * ThreadsList: Responsive sort tabs, mobile-optimized thread cards with inline stats
    * ThreadComposer: Mobile toolbar (icon-only), close/discard buttons (ArrowLeft/X), responsive category selector
    * Responsive patterns: `px-3 sm:px-6`, `text-base sm:text-xl`, `hidden sm:flex`, `flex-wrap`
  - **Documentation:** Comprehensive implementation guide for tasks 10-25 in `docs/FORUM_REMAINING_TASKS.md`
  - **Remaining Work:** Mentions, drafts, attachments, real-time updates, AI moderation, notifications (see documentation)
- **Admin Console:** Planned for content management and moderation.

**System Design Choices:**
- **Deployment:** Replit for development, production deployment TBD.
- **Scalability:** Cursor-based pagination implemented for API performance.
- **Modularity:** AI adapter pattern for flexible AI service integration.
- **Database Setup (October 31, 2025):** 
  - Database migrations must be run after import: `pnpm --filter db migrate`
  - To populate feeds, run setup script: `pnpm setup` (includes migrations, admin seeding, source seeding, and initial feed ingestion)
  - Feed API requires populated database tables to display content
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
