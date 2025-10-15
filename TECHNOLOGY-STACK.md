# CloudSharing Technology Stack & Architecture

## 📋 Project Overview
CloudSharing is a comprehensive file sharing and video conferencing platform built with modern web technologies. This document provides an in-depth breakdown of all technologies used and their specific implementations within the application.

## 🏗️ Core Framework & Runtime

### **Next.js 14.2.3** - React Framework
**Usage Locations:**
- `app/` directory structure (App Router)
- `pages/api/` for API routes
- Server-side rendering and static generation
- Middleware for security headers and rate limiting

**Key Features Used:**
- App Router with nested layouts
- Server Components for SEO optimization
- Client Components for interactive features
- API Routes for backend functionality
- Middleware for request processing
- Built-in TypeScript support

### **React 18.3.1** - UI Library
**Usage Locations:**
- All `.js/.jsx` files in `app/` directory
- Client components with `"use client"` directive
- Custom hooks and context providers

**Key Features Used:**
- Hooks (useState, useEffect, useRef, useContext)
- Context API for global state management
- Suspense for loading states
- React Strict Mode for development

### **TypeScript 5.9.3** - Type Safety
**Usage Locations:**
- `middleware.ts` - Request processing and rate limiting
- Type definitions for API responses
- Firebase configuration types

## 🔥 Backend & Database

### **Firebase** - Backend-as-a-Service
**Version:** 10.12.2
**Services Used:**

#### **Firebase Authentication**
**Usage Locations:**
- `app/_utils/FirebaseAuthContext.js` - Auth context provider
- `firebaseConfig.js` - Auth initialization
- Login/signup pages and protected routes

**Features Used:**
- Email/password authentication
- User session management
- Password reset functionality
- Email verification

#### **Cloud Firestore** - NoSQL Database
**Usage Locations:**
- `firebaseConfig.js` - Database initialization
- `app/api/` routes for data operations
- User data storage and retrieval
- Real-time data synchronization

**Collections Used:**
- `uploadedFile` - Individual file metadata
- `uploadedFolders` - Folder metadata and file lists
- `recycleBin` - Deleted files storage
- `userSubscriptions` - User plan information
- `paymentHistory` - Payment transaction records
- `userRoles` - User permission management

#### **Firebase Storage** - File Storage
**Usage Locations:**
- `app/(dashboard)/(router)/upload/page.js` - File upload logic
- `firebaseConfig.js` - Storage configuration
- File download and sharing functionality

**Features Used:**
- Resumable uploads with progress tracking
- File metadata storage
- Public URL generation for sharing
- Automatic cleanup on user deletion

### **Firebase Admin SDK** - Server-side Operations
**Version:** 13.4.0
**Usage Locations:**
- `lib/firebaseAdmin.js` - Server-side Firebase operations
- API routes requiring elevated permissions

## 📧 Communication & Email

### **Nodemailer** - Email Service
**Version:** 6.9.13
**Usage Locations:**
- `app/api/send/route.js` - Single email sending
- `app/api/send-bulk-email/route.js` - Bulk email operations
- `app/api/send-email/route.js` - Email template sending

**Features Used:**
- Gmail SMTP integration
- Connection pooling for performance
- Rate limiting (5 emails/second)
- HTML and text email support
- Bulk email processing with Promise.all()

### **Resend** - Email Delivery Service
**Version:** 3.2.0
**Usage Locations:**
- Email delivery fallback and advanced features
- Transactional email sending

## 💳 Payment Processing

### **Cashfree Payment Gateway**
**SDK Versions:**
- `@cashfreepayments/cashfree-js`: 1.0.5
- `cashfree-pg`: 5.0.8

**Usage Locations:**
- `app/api/create-payment-session/route.js` - Payment session creation
- `app/api/payment/route.js` - Payment verification
- Upgrade page for subscription management

**Features Used:**
- Secure payment session creation
- INR currency support
- Order management and tracking
- Webhook integration for payment confirmation

## 🎥 Real-time Communication

### **WebRTC** - Video Conferencing
**Native Browser API**
**Usage Locations:**
- `app/(dashboard)/(router)/meeting/join/page.js` - Video meeting implementation
- Camera and microphone access
- Peer-to-peer video streaming

**Features Used:**
- `getUserMedia()` for camera/microphone access
- RTCPeerConnection for video streaming
- ICE candidates for NAT traversal
- Media stream management

### **Firebase Firestore** - Signaling
**Real-time signaling for WebRTC**
**Usage Locations:**
- WebRTC offer/answer exchange
- ICE candidate sharing
- Meeting room state management

### **Ably** - Real-time Messaging
**Version:** 2.10.1
**Usage Locations:**
- `app/api/ably-token.js` - Token generation
- Real-time notifications and updates
- Live user presence indicators

## 🎨 UI/UX & Styling

### **Tailwind CSS** - Utility-first CSS
**Version:** 3.4.17
**Usage Locations:**
- All component styling
- `tailwind.config.js` - Configuration
- Responsive design implementation

**Features Used:**
- Utility classes for rapid styling
- Responsive breakpoints
- Dark mode support
- Custom color schemes

### **Framer Motion** - Animation Library
**Version:** 11.18.2
**Usage Locations:**
- `app/(dashboard)/(router)/files/_components/FilesPage.js` - File list animations
- Page transitions and micro-interactions
- Loading states and hover effects

### **React Icons** - Icon Library
**Version:** 5.5.0
**Usage Locations:**
- `app/(dashboard)/(router)/meeting/page.js` - Meeting icons
- File type icons throughout the application
- Navigation and action buttons

**Icon Sets Used:**
- Feather Icons (FiVideo, FiUsers, FiCopy)
- Lucide React icons

### **React Hot Toast** - Notification System
**Version:** 2.6.0
**Usage Locations:**
- Success/error message display
- File upload progress notifications
- User feedback throughout the app

### **React Toastify** - Alternative Toast Library
**Version:** 9.1.3
**Usage Locations:**
- Additional notification system
- Persistent notifications

## 📄 Document Processing

### **React PDF** - PDF Viewer
**Version:** 9.0.0
**Usage Locations:**
- PDF file preview and viewing
- Document sharing functionality

### **jsPDF** - PDF Generation
**Version:** 3.0.1
**Usage Locations:**
- PDF export functionality
- Document generation from web content

### **html2canvas** - Screenshot Generation
**Version:** 1.4.1
**Usage Locations:**
- Webpage screenshot capture
- Image export functionality

### **JSZip** - File Compression
**Version:** 3.10.1
**Usage Locations:**
- Multiple file download as ZIP
- Folder compression and archiving

## 🔧 Development Tools

### **ESLint** - Code Linting
**Version:** 8.57.0
**Usage Locations:**
- Code quality enforcement
- `eslint.config.js` - Configuration
- Development workflow

### **PostCSS** - CSS Processing
**Version:** 8.4.38
**Usage Locations:**
- CSS transformation and optimization
- Tailwind CSS processing

### **Autoprefixer** - CSS Vendor Prefixes
**Version:** 10.4.21
**Usage Locations:**
- Cross-browser CSS compatibility

## 📊 Data Visualization

### **Recharts** - Chart Library
**Version:** 3.0.0
**Usage Locations:**
- Storage usage visualization
- Analytics and reporting
- Dashboard charts

## 🛠️ Utility Libraries

### **Axios** - HTTP Client
**Version:** 1.7.2
**Usage Locations:**
- API calls to external services
- HTTP request handling

### **Date-fns** - Date Utilities
**Version:** 4.1.0
**Usage Locations:**
- Date formatting and manipulation
- File timestamp display

### **UUID** - Unique ID Generation
**Version:** 11.1.0
**Usage Locations:**
- File ID generation
- Payment order IDs

### **Nanoid** - URL-friendly IDs
**Version:** 5.1.5
**Usage Locations:**
- Short URL generation for file sharing

### **File Saver** - File Download
**Version:** 2.0.5
**Usage Locations:**
- Client-side file downloading
- Export functionality

### **QRCode.react** - QR Code Generation
**Version:** 4.2.0
**Usage Locations:**
- QR code generation for sharing links

### **Emoji Picker React** - Emoji Selection
**Version:** 4.13.2
**Usage Locations:**
- Emoji picker in chat/messaging features

## 🔒 Security & Monitoring

### **Sentry** - Error Monitoring
**Version:** @sentry/nextjs 9.40.0
**Usage Locations:**
- Error tracking and reporting
- Performance monitoring
- User feedback collection

### **Vercel Speed Insights** - Performance Monitoring
**Version:** 1.0.10
**Usage Locations:**
- Performance metrics collection
- User experience monitoring

### **Vercel Edge Config** - Configuration Management
**Version:** 1.1.1
**Usage Locations:**
- Environment-specific configuration
- Feature flags and settings

## 🚀 Deployment & Hosting

### **Vercel** - Cloud Platform
**Features Used:**
- Next.js optimized deployment
- Serverless function execution
- Edge network for global performance
- Automatic HTTPS and SSL
- Environment variable management

### **GitHub** - Version Control
**Integration:**
- Automatic deployments on push
- Pull request previews
- Branch protection rules

## 📱 Progressive Web App Features

### **Service Worker** (Planned)
- Offline functionality
- Background sync
- Push notifications

### **Web App Manifest**
**Location:** `public/favicon_io/site.webmanifest`
- App installation capability
- Offline access
- Native app-like experience

## 🔧 Build & Development Tools

### **Webpack** - Module Bundler
**Version:** 5.91.0
**Usage Locations:**
- Custom webpack configuration
- Bundle optimization
- Development server

### **Webpack Bundle Analyzer**
**Version:** 4.10.2
**Usage Locations:**
- Bundle size analysis
- Optimization insights

### **Rimraf** - Cross-platform rm -rf
**Version:** 5.0.10
**Usage Locations:**
- Build cleanup scripts

### **Glob** - File Pattern Matching
**Version:** 10.3.10
**Usage Locations:**
- File system operations
- Pattern-based file selection

## 🎮 Advanced Features

### **Three.js** - 3D Graphics
**Version:** 0.157.0 (Pinned)
**Usage Locations:**
- 3D visualizations (planned)
- Advanced UI components

### **Post Processing** - Visual Effects
**Version:** 6.37.7
**Usage Locations:**
- Image and video post-processing
- Visual effects for media files

### **Styled Components** - CSS-in-JS
**Version:** 6.1.11
**Usage Locations:**
- Dynamic styling
- Theme-based component styling

## 📋 Environment & Configuration

### **Environment Variables**
**Critical Variables:**
- Firebase configuration (API keys, project IDs)
- Email service credentials (Gmail SMTP)
- Payment gateway keys (Cashfree)
- Ably real-time messaging keys
- Sentry monitoring keys

### **Configuration Files**
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `firebaseConfig.js` - Firebase initialization
- `middleware.ts` - Request middleware

## 🔄 Data Flow Architecture

### **Client-Server Communication**
1. **Frontend (React/Next.js)** → API Routes → **Firebase Services**
2. **Real-time Updates** via Firestore listeners
3. **File Uploads** → Firebase Storage → Firestore metadata
4. **Payments** → Cashfree API → Firestore records
5. **Email** → Nodemailer/Resend → Gmail SMTP

### **State Management**
- React Context for authentication
- Local component state for UI
- Firestore real-time listeners for data sync
- URL state for routing and sharing

## 🚀 Performance Optimizations

### **Next.js Optimizations**
- Server-side rendering
- Static generation where possible
- Image optimization with Next.js Image component
- Code splitting and lazy loading

### **Caching Strategies**
- Firebase persistent cache
- Browser caching for static assets
- CDN delivery via Vercel

### **Bundle Optimization**
- Tree shaking
- Code splitting
- Compression and minification

## 🔐 Security Measures

### **Authentication & Authorization**
- Firebase Authentication with email verification
- Protected routes with middleware
- User role-based access control

### **Data Security**
- Firebase security rules
- Encrypted file storage
- Secure API key management

### **Network Security**
- HTTPS enforcement
- CORS configuration
- Rate limiting in middleware

## 📈 Scalability Features

### **Horizontal Scaling**
- Serverless architecture with Vercel
- Firebase's automatic scaling
- Connection pooling for email services

### **Database Optimization**
- Firestore indexing
- Efficient query patterns
- Real-time listeners with proper cleanup

### **CDN & Caching**
- Vercel edge network
- Firebase CDN for storage
- Browser caching strategies

---

## 🎯 Technology Usage Summary

| Category | Technology | Primary Use | Files/Components |
|----------|------------|-------------|------------------|
| **Framework** | Next.js 14 | Full-stack React framework | All pages, API routes |
| **UI Library** | React 18 | Component-based UI | All components |
| **Database** | Firebase Firestore | Data storage & real-time sync | All data operations |
| **Storage** | Firebase Storage | File uploads & downloads | Upload functionality |
| **Auth** | Firebase Auth | User authentication | Login, signup, protected routes |
| **Email** | Nodemailer | Email sending | Contact forms, notifications |
| **Payments** | Cashfree | Payment processing | Subscription upgrades |
| **Real-time** | WebRTC + Firestore | Video conferencing | Meeting rooms |
| **Styling** | Tailwind CSS | Utility-first CSS | All UI components |
| **Icons** | React Icons | Icon library | Navigation, actions |
| **Animations** | Framer Motion | UI animations | Transitions, loading states |
| **Notifications** | React Hot Toast | User feedback | Success/error messages |
| **PDF** | React PDF | Document viewing | File previews |
| **Charts** | Recharts | Data visualization | Analytics, storage usage |
| **Deployment** | Vercel | Cloud hosting | Production deployment |

This comprehensive technology stack enables CloudSharing to provide a robust, scalable, and feature-rich file sharing and video conferencing platform with modern web technologies and best practices.