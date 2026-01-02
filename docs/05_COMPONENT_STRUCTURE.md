# Component Structure

## Directory Layout

```
src/components/
├── assessment/          # Assessment module components
│   ├── pronunciation/  # Pronunciation module
│   ├── fluency/        # Fluency module
│   ├── confidence/     # Confidence module
│   ├── syntax/         # Syntax module
│   ├── conversation/   # Conversation module
│   ├── comprehension/  # Comprehension module
│   ├── shared/         # Shared assessment components
│   └── ...
├── sales/              # Sales Copilot components
│   ├── CallScreen.tsx
│   ├── LeadInbox.tsx
│   ├── LeadDetail.tsx
│   ├── QualificationMeter.tsx
│   ├── CallStageTimeline.tsx
│   ├── ObjectionLibrary.tsx
│   └── ClosePanel.tsx
├── ui/                 # shadcn/ui components
└── [root components]   # AdminToolbar, DevNav, etc.
```

## Assessment Components

### Pronunciation Module

**Location:** `src/components/assessment/pronunciation/`

**Components:**
- `PronunciationModule.tsx` - Main module component
  - Handles reading, repeat, minimal pairs
  - Audio recording
  - Immediate feedback display
  - Retry limit (2 attempts)
  - Score display with word heatmap

**Key Features:**
- Azure Speech API integration
- Word-level accuracy scoring
- Fallback scoring from word data
- Real-time feedback

---

### Fluency Module

**Location:** `src/components/assessment/fluency/`

**Components:**
- `FluencyModule.tsx` - Main module
- `FluencyRecordingCard.tsx` - Recording interface
- `FluencyRedoDialog.tsx` - Retry confirmation
- `FluencyIntroPanel.tsx` - Instructions

**Key Features:**
- Picture description (3 items)
- WPM calculation
- Module locking
- Retry logic

---

### Confidence Module

**Location:** `src/components/assessment/confidence/`

**Components:**
- `ConfidenceModule.tsx` - Main module
- `ConfidenceQuestionnaire.tsx` - 8 questions
- `confidenceQuestions.ts` - Question definitions

**Key Features:**
- Questionnaire phase
- Speaking phase
- Combined scoring (50/50)

---

### Syntax Module

**Location:** `src/components/assessment/syntax/`

**Components:**
- `SyntaxModule.tsx` - Main module
- Uses shared `useSkillModule` hook

**Key Features:**
- Grammar-focused prompts
- AI scoring

---

### Conversation Module

**Location:** `src/components/assessment/conversation/`

**Components:**
- `ConversationModule.tsx` - Main module
- `conversationScenarios.ts` - Scenario definitions

**Key Features:**
- AI agent interactions
- Multi-turn dialogue
- TTS playback
- Scenario-based

---

### Comprehension Module

**Location:** `src/components/assessment/comprehension/`

**Components:**
- `ComprehensionModule.tsx` - Main module
- `comprehensionItems.ts` - Item definitions

**Key Features:**
- Audio playback
- Question answering
- AI scoring

---

### Shared Assessment Components

**Location:** `src/components/assessment/shared/`

**Components:**
- `useSkillModule.ts` - Shared hook for skill modules
  - Audio recording
  - Transcription
  - Score processing
  - Attempt tracking
- `SkillRecordingCard.tsx` - Recording UI
- `types.ts` - Shared types

---

### Personality Quiz

**Location:** `src/components/assessment/personality-quiz/`

**Components:**
- `PersonalityQuiz.tsx` - Main quiz
- `PersonalityResult.tsx` - Results display
- `FeedbackDialog.tsx` - Results dialog
- `questions/` - Question type components:
  - `CharacterQuestion.tsx`
  - `LikertQuestion.tsx`
  - `RankingQuestion.tsx`
  - `ScenarioQuestion.tsx`
  - `SliderQuestion.tsx`
  - `TradeOffQuestion.tsx`
- `export/` - Export functionality
  - `ExportDialog.tsx`
  - `PDFPages.tsx`
  - `SocialSlide1.tsx`

---

## Sales Copilot Components

### CallScreen.tsx

Main workspace for sales calls.

**Features:**
- 3-column layout
- Next question display
- Answer buttons (keyboard shortcuts)
- Notes panel
- Tags panel
- Objections library
- Qualification meter
- Stage timeline

**Props:**
```typescript
{
  call: Call
  lead: Lead
  playbook: PlaybookData
  onCallUpdate: (call: Call) => void
}
```

---

### LeadInbox.tsx

Lead list and search.

**Features:**
- Lead listing
- Search functionality
- Create new lead button
- Linked user indicators

---

### LeadDetail.tsx

Lead information display.

**Features:**
- Lead data display
- Assessment data integration
- Start call button
- Edit functionality

---

### QualificationMeter.tsx

Live qualification score display.

**Features:**
- Score visualization (0-100)
- Band display (Low/Medium/High)
- Reason text
- Hard disqualify warnings

---

### CallStageTimeline.tsx

Visual progress through call stages.

**Features:**
- 7 stages display
- Current stage highlighting
- Completed stage indicators

---

### ObjectionLibrary.tsx

One-click objection handling.

**Features:**
- 9 objection types
- Talk track display
- Add to notes functionality

---

### ClosePanel.tsx

Closing interface.

**Features:**
- Payment options
- Checkout link
- Closing scripts
- Mark as won/lost

---

## Admin Components

### AdminToolbar.tsx

Top navigation bar for admins.

**Features:**
- Jump to stage
- Jump to module
- New session
- Current location display

**Visibility:** Admin-only (via `useAdminMode`)

---

### LiveDataViewer.tsx

Real-time data display.

**Features:**
- Last 5 recordings
- Auto-refresh (3 seconds)
- Score display
- Transcript display
- AI feedback

**Location:** Bottom right, floating

---

### DevSessionViewer.tsx

Session debugging tool.

**Features:**
- All recording types
- Session metadata
- Events log
- Tabbed interface

**Location:** Bottom left, database icon

---

### DevNav.tsx

Quick navigation menu.

**Features:**
- Route navigation
- Module jumping
- Assessment phase navigation

---

## UI Components (shadcn/ui)

Located in `src/components/ui/` - Standard shadcn/ui components:

- `button.tsx`
- `card.tsx`
- `input.tsx`
- `textarea.tsx`
- `dialog.tsx`
- `sheet.tsx`
- `badge.tsx`
- `progress.tsx`
- `toast.tsx`
- `select.tsx`
- `checkbox.tsx`
- `radio-group.tsx`
- `slider.tsx`
- `tabs.tsx`
- `accordion.tsx`
- `chart.tsx`
- And more...

---

## Page Components

Located in `src/pages/`:

- `Index.tsx` - Landing page
- `Signup.tsx` - Signup form
- `Login.tsx` - Login form
- `Assessment.tsx` - Main assessment orchestration
- `Results.tsx` - Results display
- `AdminProducts.tsx` - Systeme.io product management
- `admin/SalesCopilot.tsx` - Sales Copilot main page
- `DevPreview.tsx` - Dev tools
- `DevPronunciationTest.tsx` - Pronunciation QA testing

---

## Component Patterns

### Custom Hooks

- `useAdminMode()` - Admin detection
- `useSkillModule()` - Shared skill module logic
- `useAuth()` - Authentication context

### Context Providers

- `AuthProvider` - Authentication state
- `QueryClientProvider` - React Query
- `TooltipProvider` - Tooltip context

### Shared Utilities

- `src/lib/utils.ts` - `cn()` function (class merging)
- `src/lib/sales/` - Sales Copilot logic
- `src/integrations/supabase/` - Supabase client

---

## Styling

- **Tailwind CSS** - Utility classes
- **CSS Variables** - Theme colors (in `src/index.css`)
- **shadcn/ui** - Component styling
- **Responsive** - Mobile-first design

---

## Component Communication

- **Props** - Parent to child
- **Context** - Global state (Auth)
- **React Query** - Server state
- **Callbacks** - Child to parent
- **URL State** - Route parameters
- **Local Storage** - Persistence (dev mode)

