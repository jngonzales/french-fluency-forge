# Documentation Index - French Fluency Forge

## 📚 Complete Documentation Library

This file lists all documentation available for the French Fluency Forge codebase.

---

## 🎯 Start Here

### For Everyone
- **[CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md)** - Complete overview in one file
- **[docs/README.md](docs/README.md)** - Documentation index with navigation

### For New Developers
- **[docs/13_QUICK_START.md](docs/13_QUICK_START.md)** - Get running in 10 minutes
- **[docs/00_OVERVIEW.md](docs/00_OVERVIEW.md)** - What this app does

### For AI Agents
- **[docs/15_AI_AGENT_CONTEXT.md](docs/15_AI_AGENT_CONTEXT.md)** - Essential context for AI assistants
- **[CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md)** - Quick reference

---

## 📖 Core Documentation

### Foundation (Read First)

| File | Description | Key Info |
|------|-------------|----------|
| [00_OVERVIEW.md](docs/00_OVERVIEW.md) | Application overview | Purpose, features, flow, file structure |
| [01_TECH_STACK.md](docs/01_TECH_STACK.md) | Technologies used | React, Supabase, Azure, OpenAI, dependencies |
| [02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md) | Complete database structure | Tables, relationships, RLS policies, enums |
| [03_FEATURES.md](docs/03_FEATURES.md) | Implemented features list | What works, what's partial, what's not implemented |
| [04_API_REFERENCE.md](docs/04_API_REFERENCE.md) | API endpoints | Edge Functions, request/response formats |

### Implementation Details

| File | Description | Key Info |
|------|-------------|----------|
| [05_COMPONENT_STRUCTURE.md](docs/05_COMPONENT_STRUCTURE.md) | Code organization | Component hierarchy, file locations, patterns |
| [06_ASSESSMENT_MODULES.md](docs/06_ASSESSMENT_MODULES.md) | Assessment system | 6 modules, scoring, recording flow |
| [07_SALES_COPILOT.md](docs/07_SALES_COPILOT.md) | Sales CRM system | Lead management, call screen, decision engine |
| [08_ADMIN_TOOLS.md](docs/08_ADMIN_TOOLS.md) | Admin/dev features | Admin toolbar, live viewer, debugger |

### Operations

| File | Description | Key Info |
|------|-------------|----------|
| [09_DEPLOYMENT.md](docs/09_DEPLOYMENT.md) | Deployment procedures | Lovable, GitHub, environment variables |
| [10_DEVELOPMENT_GUIDE.md](docs/10_DEVELOPMENT_GUIDE.md) | Common dev tasks | Adding features, debugging, workflows |
| [13_QUICK_START.md](docs/13_QUICK_START.md) | Fast onboarding | Setup, admin mode, exploration |
| [14_TROUBLESHOOTING.md](docs/14_TROUBLESHOOTING.md) | Problem solving | Common issues, solutions, debug checklist |

### Design & Architecture

| File | Description | Key Info |
|------|-------------|----------|
| [11_BRAND_IDENTITY.md](docs/11_BRAND_IDENTITY.md) | Design system | Colors, fonts, voice, UI patterns |
| [12_ARCHITECTURE.md](docs/12_ARCHITECTURE.md) | System architecture | Data flow, state management, security |

### Special Purpose

| File | Description | Key Info |
|------|-------------|----------|
| [15_AI_AGENT_CONTEXT.md](docs/15_AI_AGENT_CONTEXT.md) | AI assistant guidance | Patterns, rules, common scenarios |
| [CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md) | One-file overview | Everything in one place |

---

## 📂 Documentation by Topic

### Authentication & Users
- [00_OVERVIEW.md](docs/00_OVERVIEW.md) - User journey
- [02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md) - `profiles`, `auth` tables
- [03_FEATURES.md](docs/03_FEATURES.md) - Auth features
- [04_API_REFERENCE.md](docs/04_API_REFERENCE.md) - Auth API
- [14_TROUBLESHOOTING.md](docs/14_TROUBLESHOOTING.md) - Auth issues

### Assessment System
- [06_ASSESSMENT_MODULES.md](docs/06_ASSESSMENT_MODULES.md) - Complete module details
- [02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md) - Recording tables
- [04_API_REFERENCE.md](docs/04_API_REFERENCE.md) - Assessment APIs
- [05_COMPONENT_STRUCTURE.md](docs/05_COMPONENT_STRUCTURE.md) - Component organization

### Sales Copilot
- [07_SALES_COPILOT.md](docs/07_SALES_COPILOT.md) - Complete CRM documentation
- [02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md) - Sales tables
- [05_COMPONENT_STRUCTURE.md](docs/05_COMPONENT_STRUCTURE.md) - Sales components

### Member Dashboard
- [00_OVERVIEW.md](docs/00_OVERVIEW.md) - Dashboard overview
- [05_COMPONENT_STRUCTURE.md](docs/05_COMPONENT_STRUCTURE.md) - Dashboard components
- [11_BRAND_IDENTITY.md](docs/11_BRAND_IDENTITY.md) - Design patterns

### Admin & Testing
- [08_ADMIN_TOOLS.md](docs/08_ADMIN_TOOLS.md) - All admin features
- [10_DEVELOPMENT_GUIDE.md](docs/10_DEVELOPMENT_GUIDE.md) - Testing guide
- [13_QUICK_START.md](docs/13_QUICK_START.md) - Admin setup

### Deployment & Operations
- [09_DEPLOYMENT.md](docs/09_DEPLOYMENT.md) - Full deployment guide
- [14_TROUBLESHOOTING.md](docs/14_TROUBLESHOOTING.md) - Common issues
- [10_DEVELOPMENT_GUIDE.md](docs/10_DEVELOPMENT_GUIDE.md) - Dev workflows

### Design & UX
- [11_BRAND_IDENTITY.md](docs/11_BRAND_IDENTITY.md) - Complete design system
- [12_ARCHITECTURE.md](docs/12_ARCHITECTURE.md) - UI architecture

---

## 🔍 Find Information By Question

### "How do I...?"

**...set up the project locally?**
→ [13_QUICK_START.md](docs/13_QUICK_START.md)

**...become an admin?**
→ [08_ADMIN_TOOLS.md](docs/08_ADMIN_TOOLS.md) or [13_QUICK_START.md](docs/13_QUICK_START.md)

**...add a new feature?**
→ [10_DEVELOPMENT_GUIDE.md](docs/10_DEVELOPMENT_GUIDE.md)

**...fix a bug?**
→ [14_TROUBLESHOOTING.md](docs/14_TROUBLESHOOTING.md)

**...deploy to production?**
→ [09_DEPLOYMENT.md](docs/09_DEPLOYMENT.md)

**...run tests?**
→ [10_DEVELOPMENT_GUIDE.md](docs/10_DEVELOPMENT_GUIDE.md) or [13_QUICK_START.md](docs/13_QUICK_START.md)

**...add a database table?**
→ [02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md) + [10_DEVELOPMENT_GUIDE.md](docs/10_DEVELOPMENT_GUIDE.md)

**...create a new component?**
→ [05_COMPONENT_STRUCTURE.md](docs/05_COMPONENT_STRUCTURE.md) + [10_DEVELOPMENT_GUIDE.md](docs/10_DEVELOPMENT_GUIDE.md)

**...use the Sales Copilot?**
→ [07_SALES_COPILOT.md](docs/07_SALES_COPILOT.md)

**...understand the assessment flow?**
→ [06_ASSESSMENT_MODULES.md](docs/06_ASSESSMENT_MODULES.md)

### "What is...?"

**...the tech stack?**
→ [01_TECH_STACK.md](docs/01_TECH_STACK.md)

**...the database structure?**
→ [02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md)

**...implemented vs not?**
→ [03_FEATURES.md](docs/03_FEATURES.md)

**...the API format?**
→ [04_API_REFERENCE.md](docs/04_API_REFERENCE.md)

**...the brand identity?**
→ [11_BRAND_IDENTITY.md](docs/11_BRAND_IDENTITY.md)

**...the architecture?**
→ [12_ARCHITECTURE.md](docs/12_ARCHITECTURE.md)

### "Why is...?"

**...my test failing?**
→ [14_TROUBLESHOOTING.md](docs/14_TROUBLESHOOTING.md)

**...the admin toolbar not showing?**
→ [08_ADMIN_TOOLS.md](docs/08_ADMIN_TOOLS.md) + [14_TROUBLESHOOTING.md](docs/14_TROUBLESHOOTING.md)

**...my database query failing?**
→ [02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md) + [14_TROUBLESHOOTING.md](docs/14_TROUBLESHOOTING.md)

**...the pronunciation score 0?**
→ [06_ASSESSMENT_MODULES.md](docs/06_ASSESSMENT_MODULES.md) + [14_TROUBLESHOOTING.md](docs/14_TROUBLESHOOTING.md)

---

## 📊 Documentation Stats

- **Total Files:** 16 documentation files
- **Total Lines:** ~5,000+ lines of documentation
- **Coverage:** 
  - ✅ Tech stack
  - ✅ Database schema
  - ✅ Features list
  - ✅ API reference
  - ✅ Component structure
  - ✅ Assessment modules
  - ✅ Sales Copilot
  - ✅ Admin tools
  - ✅ Deployment
  - ✅ Development guide
  - ✅ Brand identity
  - ✅ Architecture
  - ✅ Quick start
  - ✅ Troubleshooting
  - ✅ AI agent context

---

## 🎓 Learning Path

### Day 1: Understand the App
1. Read [CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md)
2. Read [00_OVERVIEW.md](docs/00_OVERVIEW.md)
3. Skim [03_FEATURES.md](docs/03_FEATURES.md)
4. Follow [13_QUICK_START.md](docs/13_QUICK_START.md) to set up locally

### Day 2: Explore the Code
1. Read [05_COMPONENT_STRUCTURE.md](docs/05_COMPONENT_STRUCTURE.md)
2. Read [02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md)
3. Read [04_API_REFERENCE.md](docs/04_API_REFERENCE.md)
4. Explore codebase with admin tools

### Day 3: Deep Dive
1. Read [06_ASSESSMENT_MODULES.md](docs/06_ASSESSMENT_MODULES.md)
2. Read [07_SALES_COPILOT.md](docs/07_SALES_COPILOT.md)
3. Read [08_ADMIN_TOOLS.md](docs/08_ADMIN_TOOLS.md)
4. Read [12_ARCHITECTURE.md](docs/12_ARCHITECTURE.md)

### Day 4: Operations
1. Read [09_DEPLOYMENT.md](docs/09_DEPLOYMENT.md)
2. Read [10_DEVELOPMENT_GUIDE.md](docs/10_DEVELOPMENT_GUIDE.md)
3. Read [14_TROUBLESHOOTING.md](docs/14_TROUBLESHOOTING.md)
4. Run tests, make a small change

### Day 5: Design & UX
1. Read [11_BRAND_IDENTITY.md](docs/11_BRAND_IDENTITY.md)
2. Review UI components
3. Test user flows
4. Contribute improvements

---

## 🔄 Keeping Documentation Updated

When making changes:
- Update relevant docs in `docs/` folder
- Update [CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md) if major changes
- Update [03_FEATURES.md](docs/03_FEATURES.md) if adding/removing features
- Update [02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md) if changing database
- Update [04_API_REFERENCE.md](docs/04_API_REFERENCE.md) if changing APIs

---

## 💡 Pro Tips

- **Use Cmd/Ctrl+F** to search within docs
- **Start with summaries** before deep dives
- **Check troubleshooting** before asking questions
- **Follow existing patterns** shown in docs
- **Test with admin tools** for faster iteration
- **Read code comments** for implementation details

---

## 🆘 Need Help?

1. **Search docs** - Use this index
2. **Check troubleshooting** - [14_TROUBLESHOOTING.md](docs/14_TROUBLESHOOTING.md)
3. **Check browser console** - Look for errors
4. **Check Supabase logs** - Edge Function errors
5. **Use admin tools** - Live Data Viewer, Session Debugger
6. **Ask Tom** - tom@solvlanguages.com

---

**Last Updated:** January 2, 2026  
**Documentation Version:** 1.0.0  
**App Version:** 1.0.0

