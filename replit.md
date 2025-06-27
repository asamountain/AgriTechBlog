# San's Agricultural Technology Blog Platform

## Overview

This is a modern agricultural technology blog platform built with a React.js frontend and Node.js/Express backend, using MongoDB for data storage. The platform focuses on delivering intelligent content for agricultural technology professionals, featuring precision farming, IoT solutions, and sustainable agriculture insights.

## System Architecture

### Frontend Architecture
- **Framework**: React.js with TypeScript (explicitly NO Next.js)
- **Styling**: Tailwind CSS with custom agricultural theme
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI components with shadcn/ui styling
- **Analytics**: Google Analytics integration for user tracking

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with native driver (not Postgres despite Drizzle config)
- **Authentication**: Session-based auth with OAuth (Google/GitHub)
- **File Storage**: Local filesystem with multer for uploads
- **AI Integration**: Perplexity API for intelligent content tagging

### Design System
- **Color Scheme**: Forest green primary (#2D5016) with agricultural theme
- **Typography**: Inter for body text, Playfair Display for headings
- **Spacing**: Golden ratio-based spacing variables
- **Responsive**: Mobile-first approach with Tailwind breakpoints

## Key Components

### Content Management System
- **Rich Text Editor**: TipTap-based markdown editor with auto-save
- **AI-Powered Tagging**: Automatic content categorization using Perplexity API
- **SEO Optimization**: Dynamic meta tags, Open Graph, and structured data
- **Image Handling**: Dynamic Open Graph image generation

### Authentication System
- **OAuth Integration**: Google and GitHub OAuth strategies
- **Persistent Sessions**: 30-day session persistence with localStorage backup
- **Demo Mode**: Development-friendly demo authentication
- **Admin Dashboard**: Full content management interface

### Database Schema
- **Posts Collection**: Blog posts with tags, categories, and user association
- **Authors Collection**: Author profiles linked to authenticated users
- **Comments Collection**: Moderated comment system with approval workflow
- **Users Collection**: Authentication and session management

## Data Flow

### Content Creation Flow
1. User authenticates via OAuth or demo mode
2. Rich text editor with auto-save every 10 seconds to `/api/admin/blog-posts`
3. AI tagging service analyzes content for suggested tags
4. Content saved as draft initially, published on user action
5. SEO metadata automatically generated

### Content Consumption Flow
1. Public blog posts fetched from `/api/blog-posts`
2. Dynamic Open Graph images generated at `/api/og-image`
3. Google Analytics tracking for page views and interactions
4. Comment submission with moderation queue

### Profile Management Flow
1. Authentication check via session verification
2. Profile data fetched/created in authors collection with userId link
3. PATCH updates to existing profiles or creation of new ones
4. Social media links and bio information stored

## External Dependencies

### Core Dependencies
- **MongoDB Atlas**: Cloud database hosting with connection string in env
- **Google Analytics**: GA4 tracking with measurement ID
- **Perplexity API**: AI content analysis and tagging
- **OAuth Providers**: Google and GitHub for authentication

### SEO and Discoverability
- **XML Sitemap**: Auto-generated at `/sitemap.xml`
- **RSS Feed**: Full content syndication at `/rss.xml`
- **Robots.txt**: AI-friendly crawling permissions
- **Structured Data**: JSON-LD markup for search engines

### Monitoring and Analytics
- **Google Search Console**: Site verification and monitoring
- **Open Graph Testing**: Built-in testing tools for social media previews
- **GEO Optimization**: Optimized for AI chatbots (GPTBot, Claude, etc.)

## Deployment Strategy

### Environment Configuration
- **Development**: Local Node.js server on port 5000 with hot reload
- **Production**: Vercel deployment with serverless functions
- **Database**: MongoDB Atlas with connection string configuration
- **Assets**: Local file system for development, cloud storage for production

### Build Process
1. TypeScript compilation check
2. Vite build for frontend assets
3. Express server bundling for API routes
4. Environment variable validation
5. Database connection verification

### Deployment Targets
- **Primary**: Vercel with automatic GitHub integration
- **Backup**: Manual deployment via CLI scripts
- **Local**: Development server with database proxy

## Changelog

- June 27, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.