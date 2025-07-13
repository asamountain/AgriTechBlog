# AgriTech Blog

## 🚀 Quick Start for Developers

**One command to rule them all:**

```bash
npm run dev
```

**Then open:** **http://localhost:5173**

That's it! 🎉

### What happens:
- ✅ Backend server starts (MongoDB + API)
- ✅ Frontend server starts (React + Vite)
- ✅ API proxy configured automatically
- ✅ Hot reload enabled for development

### Available URLs:
- **Main App**: http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin
- **Create Post**: http://localhost:5173/create-post

### Debug Features (Admin pages only):
- Press `Ctrl+Shift+D` for debug overlay
- Click purple "🔍 Debug Flow" button
- Enhanced console tracking included

---

# AgroTech Blog Platform

A sophisticated agricultural technology blog platform featuring AI-powered content management, advanced SEO optimization, and comprehensive admin tools for modern agricultural content creation.

## 🚀 Live Demo

**Production URL**: https://agritech-blog.vercel.app

## ✨ Key Features

### 🎯 Content Management
- **Advanced Post Editor**: Rich markdown editor with auto-save functionality
- **AI-Powered Tagging**: Automatic content analysis using Perplexity AI
- **Bulk Operations**: Mass publish/unpublish, feature/unfeature, and delete posts
- **Draft Management**: Auto-save drafts with seamless editing experience
- **Tag-Based Organization**: Flexible tagging system with AI suggestions
- **Related Posts**: Smart content discovery through tag relationships

### 🔍 SEO & AI Optimization
- **SEO Dashboard**: Real-time performance monitoring and optimization scores
- **AI Chatbot Visibility**: Optimized for ChatGPT, Claude, Perplexity discovery
- **Automatic Sitemaps**: XML sitemaps with real-time updates
- **Open Graph Images**: Dynamic social sharing image generation
- **Structured Data**: Schema.org markup for enhanced search visibility
- **RSS Feeds**: Full content syndication for global reach

### 🛠️ Admin Features
- **Modern Dashboard**: Intuitive admin interface with analytics
- **Profile Management**: Author profile creation and management
- **Comment System**: Advanced comment moderation and management
- **Migration Tools**: Content import/export and data management
- **Search & Filtering**: Advanced post search and filtering capabilities
- **Performance Monitoring**: SEO scores and optimization recommendations

### 🎨 User Experience
- **Forest Green Theme**: Consistent agricultural branding (#2D5016)
- **Golden Ratio Design**: Mathematically optimized proportions (1:1.618)
- **Mobile Responsive**: Optimized for all device sizes
- **Fast Performance**: Optimized loading and caching strategies
- **Social Sharing**: Integrated social media sharing tools

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB Atlas (Primary data source)
- **Styling**: Tailwind CSS + Radix UI components
- **Authentication**: Session-based auth with OAuth providers
- **Deployment**: Vercel (Frontend + Serverless functions)
- **AI Integration**: Perplexity API for content analysis

### Data Architecture
```mermaid
graph TD
    A[Client React App] --> B[Express API Server]
    B --> C[MongoDB Atlas]
    B --> D[Perplexity AI API]
    
    C --> E[Blog Posts Collection]
    C --> F[Authors Collection]
    C --> G[Comments Collection]
    C --> H[Analytics Collection]
    
    I[Vercel Deployment] --> A
    I --> J[Serverless Functions]
    J --> B
```

### Core Data Endpoints
1. **Public Posts**: `GET /api/blog-posts` - Published posts with pagination
2. **Featured Posts**: `GET /api/blog-posts/featured` - Homepage featured content
3. **Admin Posts**: `GET /api/admin/blog-posts` - All posts including drafts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Vercel account (for deployment)

### 1. Environment Setup
Create `.env` file with:
```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blog_database
MONGODB_DATABASE=blog_database

# Application Settings
SESSION_SECRET=your-secret-session-key
NODE_ENV=development
PORT=5000
BCRYPT_ROUNDS=12

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Integration (Optional)
PERPLEXITY_API_KEY=your-perplexity-api-key
```

### 2. Installation & Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Test MongoDB connection
npm run db:test
```

### 3. Production Deployment
```bash
# Deploy to Vercel
vercel --prod

# Test deployment
node test-deployment.mjs
```

## 📱 Admin Dashboard

Access the admin dashboard at `/admin` with the following features:

### Post Management
- **Create/Edit Posts**: Advanced markdown editor with live preview
- **Bulk Operations**: Select multiple posts for batch operations
- **Auto-Save**: Automatic draft saving every 10 seconds
- **Publishing Controls**: Publish/unpublish and feature/unfeature posts
- **Tag Management**: AI-suggested tags with manual override

### Analytics & SEO
- **SEO Dashboard**: Performance metrics and optimization scores
- **Content Analytics**: Post performance and engagement metrics
- **Search Engine Status**: Indexing and visibility monitoring
- **AI Bot Optimization**: Chatbot discovery optimization

### Content Tools
- **AI Tagging**: Automatic content analysis and tag suggestions
- **Migration Panel**: Import/export content and data management
- **Comment Management**: Moderate and manage user comments
- **Profile Management**: Author profile creation and editing

## 🔧 Development Guidelines

### Code Organization
```
├── client/src/           # React frontend application
│   ├── components/       # Reusable UI components
│   ├── pages/           # Application pages
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and configurations
├── server/              # Express backend server
│   ├── routes.ts        # API route definitions
│   ├── auth.ts          # Authentication configuration
│   └── mongodb-storage.ts # Database operations
├── api/                 # Vercel serverless functions
├── shared/              # Shared TypeScript types
└── docs/                # Documentation files
```

### Design Standards
- **Color Scheme**: Forest Green (#2D5016) primary, white/gray backgrounds
- **Typography**: System fonts with hierarchical sizing
- **Spacing**: Golden ratio proportions (1:1.618) for all measurements
- **Components**: Radix UI primitives with custom styling

### Database Schema
```typescript
interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🛡️ Security Features

- **Session-based Authentication**: Secure session management
- **CSRF Protection**: Built-in request forgery protection
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: API endpoint protection
- **MongoDB Security**: Parameterized queries prevent injection

## 📊 Performance Optimization

### Frontend Optimizations
- **Code Splitting**: Dynamic imports for route-based splitting
- **Image Optimization**: Automatic image compression and formats
- **Caching**: React Query for intelligent data caching
- **Bundle Optimization**: Tree shaking and minification

### Backend Optimizations
- **MongoDB Indexing**: Optimized database queries
- **Response Caching**: Intelligent API response caching
- **Connection Pooling**: Efficient database connections
- **Error Handling**: Comprehensive error management

## 🔍 SEO Features

### Technical SEO
- **XML Sitemaps**: `/sitemap.xml` - Automatically updated
- **Robots.txt**: `/robots.txt` - AI bot optimization
- **RSS Feeds**: `/rss.xml` - Full content syndication
- **Structured Data**: JSON-LD schema markup
- **Open Graph**: Dynamic social media images

### Content Optimization
- **Meta Tags**: Comprehensive page metadata
- **Canonical URLs**: Duplicate content prevention
- **Internal Linking**: Smart content cross-referencing
- **Keyword Optimization**: Agricultural technology focus

## 🤖 AI Integration

### Perplexity API Integration
- **Content Analysis**: Automatic tag generation
- **Quality Assessment**: Content optimization suggestions
- **Keyword Extraction**: SEO-relevant term identification
- **Fallback System**: Local analysis when API unavailable

### AI Chatbot Optimization
- **Structured Content**: Enhanced AI comprehension
- **Metadata Rich**: Comprehensive content context
- **Citation Friendly**: Easy content referencing
- **Global Visibility**: Multi-platform discovery

## 🚨 Troubleshooting

### Common Issues
| Issue | Cause | Solution |
|-------|-------|----------|
| Database Connection Error | Invalid MongoDB URI | Check credentials in environment variables |
| Authentication Failed | Missing session secret | Set SESSION_SECRET in environment |
| AI Tagging Not Working | Missing Perplexity API key | Add PERPLEXITY_API_KEY to environment |
| Build Failures | TypeScript errors | Run `npm run check` to identify issues |

### Debug Commands
```bash
# Test database connection
npm run db:test

# Check environment variables
node -e "console.log(process.env)"

# Validate build
npm run check && npm run build

# Test deployment endpoints
node test-deployment.mjs
```

## 🤝 Contributing

### Development Workflow
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Make changes**: Follow code standards and add tests
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open Pull Request**: Describe changes and impact

### Code Standards
- **TypeScript**: Strict typing for all code
- **ESLint**: Code quality and consistency
- **Prettier**: Automated code formatting
- **Testing**: Unit tests for critical functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Site**: https://agritech-blog.vercel.app
- **Documentation**: Comprehensive guides in `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/asamountain/AgriTechBlog/issues)
- **Discussions**: [GitHub Discussions](https://github.com/asamountain/AgriTechBlog/discussions)

---

Built with ❤️ for the agricultural technology community
