# French Fluency Forge - Documentation Index

## Quick Navigation

### For New Developers
Start here:
1. [Quick Start Guide](13_QUICK_START.md) - Get up and running in 10 minutes
2. [Overview](00_OVERVIEW.md) - What this app does
3. [Tech Stack](01_TECH_STACK.md) - Technologies used

### For AI Agents
Essential context:
1. [Overview](00_OVERVIEW.md) - Application purpose and features
2. [Database Schema](02_DATABASE_SCHEMA.md) - Complete database structure
3. [Features List](03_FEATURES.md) - What's implemented vs not
4. [API Reference](04_API_REFERENCE.md) - All endpoints and data structures

### For Understanding the Codebase
1. [Component Structure](05_COMPONENT_STRUCTURE.md) - Code organization
2. [Assessment Modules](06_ASSESSMENT_MODULES.md) - How assessments work
3. [Sales Copilot](07_SALES_COPILOT.md) - CRM system details
4. [Admin Tools](08_ADMIN_TOOLS.md) - Developer features

### For Deployment & Operations
1. [Deployment](09_DEPLOYMENT.md) - How to deploy
2. [Development Guide](10_DEVELOPMENT_GUIDE.md) - Common tasks
3. [Troubleshooting](14_TROUBLESHOOTING.md) - Fix common issues

### For Design & UX
1. [Brand Identity](11_BRAND_IDENTITY.md) - Colors, fonts, voice
2. [Architecture](12_ARCHITECTURE.md) - System design

---

## Documentation Files

### Core Documentation

| File | Purpose | Audience |
|------|---------|----------|
| `00_OVERVIEW.md` | High-level app overview | Everyone |
| `01_TECH_STACK.md` | Technologies and dependencies | Developers |
| `02_DATABASE_SCHEMA.md` | Complete database structure | Developers, AI agents |
| `03_FEATURES.md` | Implemented features list | Everyone |
| `04_API_REFERENCE.md` | API endpoints and data formats | Developers, AI agents |

### Implementation Details

| File | Purpose | Audience |
|------|---------|----------|
| `05_COMPONENT_STRUCTURE.md` | Code organization | Developers |
| `06_ASSESSMENT_MODULES.md` | Assessment system details | Developers |
| `07_SALES_COPILOT.md` | Sales CRM system | Developers, admins |
| `08_ADMIN_TOOLS.md` | Admin/dev features | Admins, developers |

### Operations & Maintenance

| File | Purpose | Audience |
|------|---------|----------|
| `09_DEPLOYMENT.md` | Deployment procedures | DevOps, developers |
| `10_DEVELOPMENT_GUIDE.md` | Common development tasks | Developers |
| `13_QUICK_START.md` | Fast onboarding | New developers |
| `14_TROUBLESHOOTING.md` | Problem solving | Everyone |

### Design & Architecture

| File | Purpose | Audience |
|------|---------|----------|
| `11_BRAND_IDENTITY.md` | Design system | Designers, developers |
| `12_ARCHITECTURE.md` | System architecture | Architects, senior developers |

---

## Key Concepts

### Assessment System
Multi-dimensional French language evaluation across 6 dimensions: Pronunciation, Fluency, Confidence, Syntax, Conversation, Comprehension.

### Sales Copilot
Internal CRM for managing high-ticket sales calls with rule-based decision engine and qualification scoring.

### Member Dashboard
Progress tracking hub with timeline, habits, goals, and gamification (badges, points).

### Admin Tools
Developer-friendly tools for rapid testing: Admin Toolbar, Live Data Viewer, Session Debugger, Jump Navigation.

---

## Tech Stack Summary

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **AI:** Azure Speech API + OpenAI GPT-4
- **Testing:** Playwright (138 E2E tests)
- **Deployment:** Lovable (auto-deploy from GitHub)

---

## Database Tables Summary

### Core Tables
- `profiles` - User profiles
- `assessment_sessions` - Assessment tracking
- `skill_recordings` - Audio recordings (pronunciation, confidence, syntax, conversation)
- `fluency_recordings` - Fluency audio recordings
- `comprehension_recordings` - Comprehension audio recordings

### Sales Tables
- `sales_leads` - Lead/prospect information
- `sales_calls` - Sales call records
- `sales_playbook` - Sales playbook configuration

### Support Tables
- `purchases` - Payment records
- `app_accounts` - Account access management
- `consent_records` - GDPR compliance
- `archetype_feedback` - Personality quiz results

---

## API Endpoints Summary

### Assessment APIs
- `analyze-pronunciation` - Azure Speech API integration
- `analyze-fluency` - WPM calculation
- `analyze-skill` - AI scoring (confidence, syntax)
- `analyze-syntax` - Grammar analysis
- `analyze-comprehension` - Listening comprehension
- `conversation-agent` - AI conversation partner
- `french-tts` - Text-to-speech
- `transcribe-pronunciation` - Audio transcription

### System APIs
- `systemeio-webhook` - Payment webhook handler

---

## Feature Status

### ✅ Production Ready
- Authentication (signup, login, password reset)
- Assessment modules (all 6 dimensions)
- Results page with visualizations
- Admin tools (toolbar, live viewer, debugger)
- Sales Copilot (CRM system)
- Member Dashboard (progress tracking)
- E2E test suite (138 tests)

### 🚧 Partially Implemented
- Export functionality (UI ready, backend incomplete)
- Audio storage (setup exists, not actively used)
- Dashboard persistence (local state only)

### ❌ Not Implemented
- User dashboard (historical progress)
- Email notifications
- Multi-language support
- Mobile app
- Advanced analytics

---

## Getting Help

1. **Search documentation** - Use this index
2. **Check troubleshooting** - Common issues covered
3. **Browser console** - Look for errors
4. **Supabase logs** - Check Edge Function logs
5. **Admin tools** - Use Live Data Viewer, Session Debugger
6. **GitHub issues** - Check existing issues
7. **Code search** - Find similar patterns in codebase

---

## Contributing

### Before Starting
1. Read relevant documentation
2. Check existing code patterns
3. Verify feature isn't already implemented
4. Test locally before pushing

### Code Standards
- Follow existing patterns
- Use TypeScript
- Write clear commit messages
- Test your changes
- Update documentation

### Pull Request Checklist
- [ ] Code compiles
- [ ] Tests pass
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Tested manually

---

## Version History

- **v1.0.0** (January 2026) - Initial release
  - Assessment system
  - Sales Copilot
  - Admin tools
  - E2E tests
  - Member Dashboard

---

## License

Proprietary - SOLV Languages

---

## Contact

**Developer:** Tom Gauthier  
**Email:** tom@solvlanguages.com  
**Website:** https://www.solvlanguages.com

