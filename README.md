# French Fluency Forge

A comprehensive French language assessment and learning platform with spaced repetition flashcards, AI-powered evaluations, and a Sales Copilot system.

## 🎯 Overview

French Fluency Forge evaluates French language skills across 6 dimensions:
- **Pronunciation** - Reading, repeating, minimal pairs
- **Fluency** - Picture description, WPM calculation
- **Confidence** - Self-assessment + speaking exercises
- **Syntax** - Grammar accuracy analysis
- **Conversation** - AI agent interactions
- **Comprehension** - Listening comprehension tests

### Additional Features
- 📚 **Phrases (SRS)** - 70 phrases across 6 themed packs with spaced repetition
- 📊 **Dashboard** - Skill profile radar chart, daily momentum habits
- 💼 **Sales Copilot** - Lead management and sales call workflows
- 🛠️ **Admin Tools** - Navigation toolbar, live data viewer, session debugger

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run E2E tests
npm run test:e2e:ui
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── assessment/      # Assessment module components
│   ├── sales/          # Sales Copilot components
│   └── ui/             # shadcn/ui components
├── features/           # Feature modules
│   ├── dashboard/      # Dashboard components & hooks
│   ├── phrases/        # SRS flashcard system
│   └── sales-copilot/  # Sales tools
├── pages/              # Route pages
├── lib/                # Business logic & utilities
├── hooks/              # React hooks
└── contexts/           # React contexts

docs/                   # Documentation
e2e/                    # Playwright E2E tests
supabase/               # Database migrations & functions
```

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui + Framer Motion
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Auth:** Supabase Auth
- **AI:** Azure Speech API + OpenAI GPT-4
- **Testing:** Playwright (138 E2E tests)

## 📖 Documentation

See the `docs/` folder for detailed documentation:
- `00_OVERVIEW.md` - Application overview
- `01_TECH_STACK.md` - Technology details
- `02_DATABASE_SCHEMA.md` - Database structure
- `03_FEATURES.md` - Feature documentation
- `10_DEVELOPMENT_GUIDE.md` - Development setup

## 🎨 Design

- **Theme:** Bone (#F6F3EE) base color
- **Components:** shadcn/ui with custom animations
- **Responsive:** Mobile-first design

## 🔐 Admin Access

To enable admin features:
1. Edit `src/config/admin.ts`
2. Add your email to `ADMIN_EMAILS` array
3. Sign in with that email
4. Yellow admin toolbar appears at top

**Shortcuts:**
- `Ctrl+Shift+A` - Toggle admin toolbar visibility

## 📦 Phrase Packs

| Pack | Theme | Phrases |
|------|-------|---------|
| Small Talk Starter | Greetings, introductions | 10 |
| Work + Logistics | Practical situations | 13 |
| Emotional Reactions | Feelings, relationships | 12 |
| School & Learning | Academic, classroom | 10 |
| Workplace | Office, professional | 10 |
| Daily Life | Routine, everyday | 10 |

**Total: 70 phrases**

---

## Original Lovable Info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
