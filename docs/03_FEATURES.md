# Features List

## ✅ Implemented Features

### Authentication & User Management

- [x] **Email/Password Signup**
  - Form validation
  - Email confirmation flow
  - Auto-profile creation

- [x] **Email/Password Login**
  - Session management
  - Remember me functionality

- [x] **Magic Link Authentication**
  - Passwordless login
  - Email-based activation

- [x] **Password Reset**
  - Forgot password flow
  - Reset via email link

- [x] **Account Activation**
  - Email verification
  - Activation page

- [x] **Protected Routes**
  - Auth-required pages
  - Redirect to login

### Assessment Flow

- [x] **Intake Form**
  - Demographics (gender, age)
  - Languages spoken
  - Goals (free text)
  - Primary track selection
  - Form validation

- [x] **Consent Form**
  - GDPR compliance
  - Recording consent
  - Data processing consent
  - Retention acknowledgment
  - IP address tracking

- [x] **Personality Quiz**
  - 8 question types:
    - Character questions
    - Likert scale
    - Ranking
    - Scenario-based
    - Trade-offs
    - Slider questions
  - Archetype identification
  - Feedback dialog with results
  - Export functionality (PDF, social slides)

- [x] **Mic Check**
  - Audio permission request
  - Test recording
  - Playback verification
  - Browser compatibility check

- [x] **Assessment Modules** (6 dimensions)

#### Pronunciation Module
- [x] Reading aloud (3 items)
  - /y/ vs /u/ distinction
  - Nasal vowels
  - /s/ vs /z/ distinction
- [x] Listen & repeat (2 items)
  - Position words
  - Liaisons
- [x] Minimal pairs game (6 items)
- [x] Azure Speech API integration
- [x] Word-level accuracy scoring
- [x] Immediate feedback display
- [x] Retry limit (max 2 attempts)
- [x] Score calculation from word-level data

#### Fluency Module
- [x] Picture description (3 pictures)
- [x] WPM (Words Per Minute) calculation
- [x] Module locking mechanism
- [x] Retry logic (item and full module)
- [x] Progress tracking
- [x] Attempt counter

#### Confidence Module
- [x] Introduction phase
- [x] Questionnaire (8 questions)
- [x] Speaking phase
- [x] Combined scoring (50% questionnaire + 50% speaking)
- [x] Honesty flag detection

#### Syntax Module
- [x] Grammar-focused prompts
- [x] AI scoring on grammatical accuracy
- [x] Feedback generation

#### Conversation Module
- [x] AI agent interactions
- [x] Multiple scenario types
- [x] Turn-based dialogue
- [x] TTS playback for agent
- [x] Multi-turn scoring
- [x] Transcript display

#### Comprehension Module
- [x] Audio passage playback
- [x] Multiple question types
- [x] AI scoring
- [x] Intent matching
- [x] Understood facts extraction

- [x] **Processing View**
  - Score calculation
  - Progress indication
  - Start fresh option

- [x] **Results Page**
  - Radar chart visualization
  - Score breakdown cards
  - Skill descriptions
  - Archetype display
  - Raw metrics sidebar
  - Export/share buttons (UI only)
  - Understanding Results section
  - What's Next card

### Admin Tools

- [x] **Admin Toolbar**
  - Jump to any assessment stage
  - Jump to any module
  - New session creation
  - Current location display
  - Admin-only visibility

- [x] **Live Data Viewer**
  - Real-time score updates
  - Transcript display
  - AI feedback viewing
  - Auto-refresh (3 seconds)
  - Last 5 recordings display

- [x] **Session Debugger**
  - All recording types (fluency, skills, comprehension)
  - Session metadata
  - Events log
  - Tabbed interface

- [x] **Dev Navigation**
  - Quick route navigation
  - Module jumping
  - Assessment phase navigation

- [x] **Admin Mode Detection**
  - Email-based admin list
  - Production support
  - Dev mode fallback

### Sales Copilot System

- [x] **Lead Management**
  - Lead inbox (list/search)
  - Lead creation
  - Lead detail view
  - Auto-linking to users by email
  - Assessment data integration

- [x] **Call Screen**
  - 3-column layout (Lead | Question | Notes)
  - Next best question engine
  - Answer buttons (1-6 keyboard shortcuts)
  - Free text input
  - Number/scale inputs
  - Continue button for script/multi_prompt questions

- [x] **Qualification Scoring**
  - Live score meter (0-100)
  - Score bands (Low/Medium/High)
  - Hard disqualify rules
  - Reason display

- [x] **Call Stage Timeline**
  - Visual progress bar
  - 7 stages (Rapport → Diagnose → Qualify → Present → Objections → Close → Next Steps)
  - Current stage highlighting

- [x] **Objection Library**
  - 9 objection types
  - One-click access
  - Talk tracks (empathy, diagnostic, reframes, proof, close)
  - Add to notes functionality

- [x] **Close Panel**
  - Payment options (1497€ / 3×499€)
  - Checkout link
  - Closing scripts
  - Mark as won/lost

- [x] **Decision Engine**
  - Rule-based next question selection
  - Stage progression logic
  - Qualification scoring
  - Priority rules
  - Checkpoint tracking

- [x] **Playbook Management**
  - JSON-based playbook storage
  - Seed data loading
  - Active playbook selection

### Payment Integration

- [x] **Systeme.io Webhook**
  - Purchase event handling
  - Account creation
  - Access status management
  - Credits tracking

### Testing

- [x] **E2E Test Suite**
  - 138 automated tests
  - Playwright framework
  - Multi-browser support
  - Test fixtures (auth, audio, database)
  - Test coverage:
    - Authentication (10 tests)
    - UI/Accessibility (24 tests)
    - Edge cases (27 tests)
    - Assessment modules (77 tests)

## 🚧 Partially Implemented

- [ ] **Export Functionality**
  - PDF export (UI ready, backend incomplete)
  - Social slides (UI ready)
  - Share buttons (disabled)

- [ ] **Audio Storage**
  - Currently sent directly to Edge Functions
  - Storage bucket setup (not actively used)

## ❌ Not Implemented

- [ ] **User Dashboard**
  - Progress tracking over time
  - Historical results comparison

- [ ] **Notifications**
  - Email notifications
  - In-app notifications

- [ ] **Multi-language Support**
  - Currently French-focused
  - UI is English

- [ ] **Mobile App**
  - Web-only currently
  - Responsive design exists

- [ ] **Advanced Analytics**
  - User behavior tracking
  - Conversion funnels

## Feature Flags

- Admin mode (via `src/config/admin.ts`)
- Dev mode (environment-based)
- LLM features (behind API keys)

## Known Limitations

1. **Audio Format:** WebM only (browser-dependent)
2. **Azure Pronunciation:** Inconsistent `PronunciationAssessment` object (fallback implemented)
3. **Retry Limits:** Pronunciation only (2 attempts), other modules unlimited
4. **Export:** PDF generation UI exists but backend incomplete
5. **Mobile:** Responsive but not optimized for mobile-first

