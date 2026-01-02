# Technology Stack

## Frontend

### Core Framework
- **React 18.3.1** - UI library
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool and dev server
- **React Router 6.30.1** - Client-side routing

### UI Framework
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **shadcn/ui** - Component library (Radix UI primitives)
- **Lucide React** - Icon library
- **Framer Motion** - Animations
- **Recharts** - Data visualization (radar charts, etc.)

### State Management
- **React Context API** - Global state (Auth)
- **React Query (TanStack)** - Server state management
- **React Hooks** - Local component state

### Forms & Validation
- **React Hook Form 7.61.1** - Form handling
- **Zod 3.25.76** - Schema validation
- **@hookform/resolvers** - Form validation integration

## Backend

### Database & Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Edge Functions (Deno runtime)
  - Storage (for audio files)
  - Real-time subscriptions

### Authentication
- **Supabase Auth** - Email/password, magic links
- **JWT tokens** - Session management
- **Row Level Security** - Database-level access control

## External Services

### AI Services
- **Azure Speech API** - Pronunciation assessment
  - Real-time transcription
  - Pronunciation scoring
  - Word-level accuracy
- **OpenAI GPT-4** - AI analysis
  - Conversation agent
  - Skill scoring (syntax, confidence, comprehension)
  - Feedback generation
  - French TTS (text-to-speech)

### Payment & CRM
- **Systeme.io** - Payment processing (webhook integration)
- **Custom Sales Copilot** - Internal CRM system

## Development Tools

### Testing
- **Playwright 1.57.0** - E2E testing
  - 138 automated tests
  - Multi-browser support
  - Test fixtures (auth, audio, database)

### Code Quality
- **ESLint 9.32.0** - Linting
- **TypeScript** - Type checking
- **Prettier** (via Lovable) - Code formatting

### Build & Deploy
- **Vite** - Production builds
- **Lovable** - Auto-deployment from GitHub
- **GitHub** - Version control

## Key Dependencies

### UI Components
```json
{
  "@radix-ui/react-*": "Various UI primitives",
  "class-variance-authority": "Component variants",
  "tailwind-merge": "Tailwind class merging",
  "clsx": "Conditional class names"
}
```

### Utilities
```json
{
  "date-fns": "Date manipulation",
  "html-to-image": "Export functionality",
  "jspdf": "PDF generation",
  "qrcode.react": "QR code generation"
}
```

### Audio/Media
- **WebRTC MediaRecorder API** - Browser audio recording
- **Blob handling** - Audio file management
- **Base64 encoding** - Audio transmission

## Environment Variables

Required in `.env`:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

Optional (for Edge Functions):
```bash
AZURE_SPEECH_KEY=azure_api_key
AZURE_SPEECH_REGION=azure_region
OPENAI_API_KEY=openai_api_key
```

## Build Configuration

### Vite Config (`vite.config.ts`)
- React SWC plugin (fast compilation)
- Path aliases (`@/` → `src/`)
- Port: 8080
- Lovable tagger plugin (dev mode)

### TypeScript Config
- Strict mode: OFF (for flexibility)
- Path mapping enabled
- JSX: React
- Target: ES2020

## Browser Support

- **Chrome/Edge** - Full support
- **Firefox** - Full support
- **Safari** - Full support (iOS 14+)
- **Mobile browsers** - Responsive design

## Performance

- **Code splitting** - Route-based
- **Lazy loading** - Component-level
- **Image optimization** - Via Vite
- **Bundle size** - Optimized with tree-shaking

## Security

- **HTTPS only** - Production
- **Row Level Security** - Database access control
- **JWT tokens** - Secure authentication
- **CORS** - Configured for Supabase
- **Environment variables** - Sensitive data protection

