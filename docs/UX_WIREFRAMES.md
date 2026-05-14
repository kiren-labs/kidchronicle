# KidChronicle — UX Wireframe & Design Specification

> **Your child's story, one day at a time.**
> Version 1.1 · May 2026 · kiren-labs
> Covers all 5 core screens + parent self-reflection layer

---

## Table of contents

1. [Design philosophy](#1-design-philosophy)
2. [Navigation architecture](#2-navigation-architecture)
3. [Screen specifications](#3-screen-specifications)
   - [3.1 Onboarding](#31-onboarding--3-steps)
   - [3.2 Home screen](#32-home-screen)
   - [3.3 Log entry screen](#33-log-entry-screen)
   - [3.4 Child profile screen](#34-child-profile-screen)
   - [3.5 History screen](#35-history-screen)
4. [Parent self-reflection layer](#4-parent-self-reflection-layer)
   - [4.1 Log entry — reflection mode](#41-log-entry-screen--reflection-mode)
   - [4.2 History — My Journey filter](#42-history-screen--my-journey-filter)
   - [4.3 Parent mood tag rationale](#43-parent-mood-tag-design-rationale)
   - [4.4 Guided prompts](#44-guided-prompts)
5. [Interaction patterns](#5-interaction-patterns)
6. [Accessibility requirements](#6-accessibility-requirements)
7. [v2.0 design considerations](#7-v20-design-considerations)
8. [Open design questions](#8-open-design-questions)
9. [Appendix: colour tokens](#9-appendix-colour-tokens)
10. [Appendix: typography](#10-appendix-typography)
11. [Appendix: file structure reference](#11-appendix-file-structure-reference)

---

## Quick reference

| Attribute | Value |
|---|---|
| Platform | PWA — installable on iOS and Android |
| Stack | Plain HTML / CSS / JavaScript — no frameworks |
| Viewport | Mobile-first (375px+); responsive for tablet and desktop |
| Font: display | Fraunces (serif italic) — logo, headings, greetings |
| Font: body | DM Sans — all functional UI |
| Background | `#FAF9F6` warm white — never pure white |
| Screens covered | Onboarding · Home · Log Entry · Child Profile · History |
| New in v1.1 | Parent self-reflection toggle + My Journey history view |

---

## 1. Design philosophy

KidChronicle is built for a **parent at 9pm** — tired, on their phone, wanting to capture something before they forget it. Every design decision flows from that scenario.

### 1.1 Core principles

| Principle | What it means | How it shows up |
|---|---|---|
| **30-second rule** | Any core action completes in under 30 seconds | Log entry: mood = 1 tap · points = 1 tap · save = 1 tap |
| **Warmth over utility** | Feels like a keepsake book, not a productivity tool | Fraunces serif italic · no red/alert colours |
| **Child-first colour** | Each child owns a colour across the entire app | Purple · teal · coral · amber — consistent everywhere |
| **Positive only** | No red flags, no failure states, no negative scoring | Profile screen is a celebration; history is a story |
| **4 tabs maximum** | No hamburger menus, no buried settings | Bottom nav: Home · Log · Points · History |
| **Offline by default** | Works with zero network after first load | Service worker caches all assets |

### 1.2 What this app is NOT

- Not a task manager or chore chart
- Not a behaviour punishment tool
- Not a leaderboard between siblings
- Not a clinical assessment platform
- Not a parenting advice app

---

## 2. Navigation architecture

### 2.1 Bottom navigation (4 tabs — maximum, never more)

| Tab | Icon | Contents | Primary action |
|---|---|---|---|
| **Home** | `ti-home` | Child cards + recent logs | Tap child → profile · FAB (+) → new entry |
| **Log** | `ti-writing` | New log entry form | Write entry · set mood · add points · save |
| **Points** | `ti-star` | Per-child points totals + chart | Award points independently of a log entry |
| **History** | `ti-clock` | Chronological log — all children | Filter · open entry detail · My Journey |

### 2.2 FAB (Floating Action Button)

```
Position:  46px circle · 14px from right edge · 68px above screen base
Colour:    #2C2C2A (dark ink)
Icon:      ti-plus (white)
Visible:   Home screen + History screen
Hidden:    Log Entry screen (to avoid confusion)
Behaviour: One tap → opens Log Entry screen in "About my child" mode
```

> **Design rule:** A parent must be able to reach any core function in **2 taps** from anywhere in the app.

### 2.3 Screen navigation flow

```
Home
 ├── tap child card ──────────────────► Child Profile
 │    └── tap back ──────────────────► Home
 ├── tap FAB (+) ─────────────────────► Log Entry
 │    └── save / back ───────────────► Home
 └── tap History tab ────────────────► History
      ├── tap filter chip ────────────► filtered History
      ├── tap "My Journey" chip ──────► Parent Reflection history
      └── tap entry ──────────────────► Entry Detail
           └── tap back ─────────────► History
```

---

## 3. Screen specifications

### 3.1 Onboarding — 3 steps

> **Goal:** Parent is using the app within 90 seconds of first open. No email, no password, no account.

```
┌─────────────────────────────┐
│                             │
│      KidChronicle           │  ← Fraunces serif bold, 26px
│  your child's story,        │  ← Fraunces italic, muted
│   one day at a time.        │
│                             │
│         [ 💚 ]              │  ← teal heart icon, 64px circle
│                             │
│      STEP 1 OF 3            │  ← 11px uppercase muted
│  What's your family name?   │  ← Fraunces 18px
│                             │
│  ┌─────────────────────┐    │
│  │  The Johnsons       │    │  ← 44px height input
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │    Continue →       │    │  ← 48px dark button, full width
│  └─────────────────────┘    │
│                             │
│       ●  ○  ○               │  ← active dot stretches to pill
└─────────────────────────────┘
```

| # | Element | UX decision |
|---|---|---|
| 1 | App logo + tagline | Fraunces serif italic tagline sets emotional tone before any interaction. First impression = warmth, not utility. |
| 2 | Progress dots | 3 dots below each step. Active dot stretches into a pill (18px wide). Parent always knows how much remains. |
| 3 | Family name input | Single text field, 44px height, auto-capitalised. No validation until Continue is tapped. |
| 4 | Continue button | Full-width, dark background, 48px height. One action per step — no distractions. |
| 5 | Child name + DOB (Step 2) | Name field + date of birth picker. DOB stored as ISO date; age computed at runtime, never stored. |
| 6 | Avatar colour picker (Step 2) | 6 colour swatches. Selected shows a ring `box-shadow: 0 0 0 2px white, 0 0 0 3.5px #2C2C2A`. This colour identifies the child everywhere permanently. |
| 7 | Done screen (Step 3) | Celebrates setup with child's name and colour. Transitions directly to Home. No settings gate, no tutorial. |

> **⏱️ 30-second target:** From app open → first log entry ready: under 90 seconds (3-step onboarding) + under 30 seconds (first log entry). Tested against Gate M2.

---

### 3.2 Home screen

> **Goal:** Answer "how are my kids doing?" in one glance. Fastest path to a new log entry.

```
┌─────────────────────────────┐
│  KidChronicle   Thursday,   │  ← logo left · date right
│                 May 14      │
│                             │
│  "Good morning,             │  ← Fraunces italic greeting
│   Johnson family"           │
│                             │
│  YOUR CHILDREN              │  ← 10px uppercase muted label
│                             │
│  ┌────────┐┌────────┐┌────┐ │
│  │  👧    ││  👦    ││ 👧 │ │  ← horizontal scroll
│  │ Layla  ││  Omar  ││Sana│ │  ← child colour cards
│  │ 240pts ││ 185pts ││92pt│ │
│  │🔥5 days││🔥3 days││New!│ │
│  └────────┘└────────┘└────┘ │
│                             │
│  RECENT LOGS                │
│  ┌─────────────────────┐    │
│  │ ● Layla      Today  │    │  ← purple dot · name · date
│  │ Helped her brother  │    │
│  │ without being asked.│    │
│  │ 😊 proud            │    │  ← mood chip
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ ● Omar   Yesterday  │    │
│  │ Finished homework   │    │
│  │ without reminder.   │    │
│  │ 👍 good             │    │
│  └─────────────────────┘    │
│                        [+]  │  ← FAB, 46px circle
│ 🏠  ✏️  ⭐  🕐            │  ← bottom nav
└─────────────────────────────┘
```

| # | Element | UX decision |
|---|---|---|
| 1 | Warm greeting | Fraunces serif italic. Personalised to family name + time of day. Creates diary feel on every open. |
| 2 | Child cards row | Horizontal scroll. Each card colour-coded to the child. Points + streak visible at a glance without opening profile. |
| 3 | Streak indicator | 🔥 + day count. No streak = no indicator (not "0 days" — absence of streak is neutral, not failure). |
| 4 | Recent logs section | Last 2–3 entries across all children. Colour dot identifies child instantly. Mood chip colour-coded. |
| 5 | FAB (+) | Always visible. One tap from anywhere. Floats 14px from right, 68px above bottom nav. |
| 6 | Bottom nav | 4 tabs with icon + label. Active = dark ink `#2C2C2A`. Inactive = muted `#888780`. No badges in v1. |
| 7 | Background | `#FAF9F6` warm white — never `#FFFFFF`. Cards on `#FFFFFF` with `0.5px` border `#E8E6DF`. |

---

### 3.3 Log entry screen

> **Goal:** Parent writes what happened, taps a mood, optionally adds points, and saves — **in under 30 seconds**.

```
┌─────────────────────────────┐
│  ←  New log entry           │  ← back button (30px circle) · Fraunces title
│                             │
│  [ Layla ][ Omar ][ Sana ]  │  ← child selector chips (coloured)
│                             │
│  What happened today?       │  ← 10px label
│  ┌─────────────────────┐    │
│  │ Helped her brother  │    │  ← free text area, auto-grows
│  │ without being asked.│    │    no character limit
│  │ Really proud of her.│    │
│  └─────────────────────┘    │
│                             │
│  HOW WAS THE MOOD?          │
│  [🌟great][👍good][😊proud] │  ← 5 fixed chips, 44px height
│  [😐ok   ][😴tired]         │    selected = dark fill
│                             │
│  AWARD POINTS? (optional)   │
│  [Helped someone +10]       │  ← deed chips, pre-defined
│  [Kind words +8]            │
│  [Homework +7][Tidied +5]   │
│  [Custom...]                │  ← opens numeric input
│                             │
│  ┌─────────────────────┐    │
│  │     Save entry      │    │  ← 48px dark button
│  └─────────────────────┘    │
└─────────────────────────────┘
```

| # | Element | UX decision |
|---|---|---|
| 1 | Child selector chips | All children shown as coloured chips. Tap to switch child without navigating back. Selected chip shows double border ring. |
| 2 | Free text area | No character limit. No formatting. No hashtags. Auto-grows. Placeholder: "What happened today?" |
| 3 | Date field | Defaults to today. Tap to back-date up to 365 days. Forward dates disabled. |
| 4 | Mood selector | 5 fixed options with emoji. One tap selects. No typing required. Selected chip goes dark fill. |
| 5 | Points deed chips | Pre-defined categories. Tap one to select. **Optional** — skipping means no points awarded. |
| 6 | Custom points | A "Custom..." chip opens a small number input for ad-hoc values. Advanced use only. |
| 7 | Save button | **One action** saves log entry AND points event in the same IndexedDB transaction. Never save twice. |
| 8 | No delete here | Delete lives inside entry detail only. This screen is write-only — prevents accidental data loss. |

> **Why mood and points are on the same screen:** Separating them into two flows doubles the time cost. A parent who logs in one 20-second session logs daily. A parent who navigates two flows logs weekly. Habit formation depends on reducing friction above all else.

---

### 3.4 Child profile screen

> **Goal:** Parent opens this screen and feels **pride**. Not a report card — a celebration.

```
┌─────────────────────────────┐
│  ←  Back to home            │
│                             │
│  [ 👧 ]  Layla              │  ← avatar (child colour) · Fraunces name
│          Age 7 · siblings   │  ← age computed at runtime
│          Joined May 2026    │
│                             │
│  ┌───────┐┌───────┐┌──────┐ │
│  │  240  ││  18   ││ 🔥 5 │ │  ← stat boxes
│  │  pts  ││ logs  ││streak│ │
│  └───────┘└───────┘└──────┘ │
│                             │
│  Points this month          │  ← 10px label
│  ┌─────────────────────┐    │
│  │ ▁ ▂ ▃ ▅ ▄ ▇ ▅ █   │    │  ← canvas bar chart, 8-week rolling
│  └─────────────────────┘    │    tallest bar = dark ink
│                             │
│  THIS WEEK'S ACTIVITY IDEA  │  ← amber callout card
│  ┌─────────────────────┐    │
│  │ For age 7 · creativity   │
│  │ Draw your favourite │    │
│  │ animal              │    │
│  │ Ask them to explain │    │
│  │ 3 things about it.  │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

| # | Element | UX decision |
|---|---|---|
| 1 | Avatar + name + meta | Large avatar circle in child's colour. Fraunces serif name. Age line: `Age 7 · has siblings · joined May 2026`. |
| 2 | Three stat boxes | Total points / log entries / streak. Three numbers, scanned in 2 seconds. `background: #F1EFE8`, no border. |
| 3 | Points bar chart | 8-week rolling. Drawn on `<canvas>` — no library. Tallest bar = `#2C2C2A`. Others = `#D3D1C7`. |
| 4 | Weekly suggestion card | Psychology engine. Amber background `#FAEEDA`. Label shows age + category. Parent can dismiss with "not now". |
| 5 | No negative data | No red colours, no "missed days" counter, no sibling comparison on this screen. Positive only. |
| 6 | Edit profile | Small secondary button top-right. Opens sheet to edit name, DOB, avatar. Delete is here, behind confirmation. |

---

### 3.5 History screen

> **Goal:** Reading back through 6 months of entries feels like reading a story, not auditing a spreadsheet.

```
┌─────────────────────────────┐
│  History                    │  ← Fraunces 18px
│                             │
│  [All][Layla][Omar][Sana]   │  ← filter chips, horizontal scroll
│  [😊proud][This week][🔍]   │
│                             │
│  ┌─────────────────────┐    │
│  │ ● Layla    Today    │    │  ← purple dot · name · date
│  │ Helped her brother  │    │
│  │ without being asked.│    │
│  │ 😊 proud  ⭐ +10pts │    │  ← mood chip + points badge
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ ● Omar  Yesterday   │    │
│  │ Finished homework   │    │
│  │ without reminder.   │    │
│  │ 👍 good   ⭐ +7pts  │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ ● Sana    May 12    │    │
│  │ First day using the │    │
│  │ app! Sana was       │    │
│  │ excited.            │    │
│  │ 🌟 great            │    │
│  └─────────────────────┘    │
│                        [+]  │
│ 🏠  ✏️  ⭐  🕐            │
└─────────────────────────────┘
```

| # | Element | UX decision |
|---|---|---|
| 1 | Filter chips row | Horizontal scroll. Active filter = dark fill. Multiple filters can stack (child + mood + date range). |
| 2 | Colour-coded child dots | Each entry has a small coloured dot. Parent learns to scan by colour before reading the name — faster. |
| 3 | Entry card structure | Dot + name (top left) · date (top right) · text (body) · mood chip (bottom left) · points badge if awarded (bottom right). |
| 4 | Points badge | Green pill: `⭐ +10 pts`. Only shown if points were awarded. Lets parent scan which moments were celebrated. |
| 5 | Chronological order | Newest first always. This is a diary, not a task list. Scrolling back = moving through time. |
| 6 | No bulk delete | Delete is inside entry detail only, behind confirmation. History screen has no edit mode or checkboxes. |
| 7 | Search | Tap `🔍` at top right → full-width text input. Searches all entry text across all children. Results update live. |
| 8 | My Journey chip | When tapped, shows only parent reflection entries (see [Section 4.2](#42-history-screen--my-journey-filter)). |

---

## 4. Parent self-reflection layer

> **Why this exists:** Parenting is a relationship. A child's behaviour is shaped as much by how the parent shows up as by anything the child does independently. The reflection layer adds the missing half — a private space for parents to notice patterns in their own behaviour and grow alongside their children.
>
> **Theoretical basis:** Reflective functioning (Fonagy, 1991) — a parent's capacity to think about their own mental states and how those affect their child — is one of the strongest predictors of secure parent-child attachment.

### 4.1 Non-negotiable design constraints

| Constraint | Reason |
|---|---|
| **No self-scoring or ratings** | Evaluative self-scoring creates shame and rumination, not growth |
| **Descriptive mood tags only** | "Reactive" describes. "2/10" judges. Descriptions enable reflection; judgments create avoidance. |
| **Completely separate data store** | `parentReflections` IndexedDB store — never mixed with `logEntries` |
| **Not a top-level nav tab** | Parent reflection is secondary. Lives behind a toggle and a history filter. |
| **Never visible to children** | Structurally impossible — child profile and default history never query `parentReflections` |
| **Co-parent entries are private** | Each parent's reflections are never shown to the other parent |

### 4.1 Log entry screen — reflection mode

When the parent taps the **"About myself"** toggle, the screen transforms:

```
┌─────────────────────────────┐
│  ←  New log entry           │
│                             │
│  ┌──────────────────────┐   │
│  │ About my child │ ● About myself │  ← pill toggle, subtle
│  └──────────────────────┘   │
│                             │
│  (child selector hidden)    │  ← disappears in reflection mode
│                             │
│  How did you show up        │  ← placeholder text changes
│  as a parent today?         │
│  ┌─────────────────────┐    │
│  │                     │    │  ← same free text area
│  └─────────────────────┘    │
│                             │
│  Prompts (tap to use):      │  ← optional, soft
│  [What went well?]          │
│  [What would you do         │
│   differently?]             │
│  [What did your child       │
│   need that was hard        │
│   to give?]                 │
│                             │
│  HOW WERE YOU?              │
│  [patient][present]         │  ← parent mood tags replace child tags
│  [reactive][distracted]     │
│  [tired]                    │
│                             │
│  ┌─────────────────────┐    │
│  │   Save reflection   │    │  ← button label changes
│  └─────────────────────┘    │
└─────────────────────────────┘
```

| # | Element | UX decision |
|---|---|---|
| 1 | Entry type toggle | Pill toggle at top: "About my child" \| "About myself". Default always = "About my child". Toggle is subtle — secondary text size. Child logging is primary. |
| 2 | Child selector disappears | When "About myself" active, child chips hidden. Entry belongs to parent, not any child. |
| 3 | Text area unchanged | Same component. Placeholder changes to "How did you show up as a parent today?" |
| 4 | Guided prompts | 3 soft chips. Tapping appends prompt text as a starter sentence. Parent still writes freely. Optional — not required. |
| 5 | Parent mood tags | 5 chips: patient · present · reactive · distracted · tired. Descriptive, not evaluative. |
| 6 | Save button | Label changes to "Save reflection". Written to `parentReflections` store, **never** to `logEntries`. |
| 7 | No points section | Points chips hidden entirely. No mechanism to award or deduct points for parent behaviour. |

---

### 4.2 History screen — My Journey filter

```
┌─────────────────────────────┐
│  History                    │
│                             │
│  [All][Layla][Omar]         │
│  [My journey ●]             │  ← active — dark fill
│                             │
│  ┌─────────────────────┐    │
│  │ 👤 Parent reflection│    │  ← parent icon (not child colour dot)
│  │ May 14              │    │    neutral grey palette
│  │ I was impatient at  │    │
│  │ bedtime tonight.    │    │
│  │ ⚡ reactive         │    │  ← parent mood tag, neutral grey pill
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ 👤 Parent reflection│    │
│  │ May 13              │    │
│  │ Really present today│    │
│  │ — put the phone     │    │
│  │ away at dinner.     │    │
│  │ ✅ present          │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

| # | Element | UX decision |
|---|---|---|
| 1 | "My journey" filter chip | Added to History filter row. When active, shows only `parentReflections` entries. Child entries hidden. |
| 2 | Parent icon marker | `👤` replaces the child colour dot. Never uses a child's colour. Makes entry type immediately clear. |
| 3 | Neutral grey palette | Parent mood chips use grey background, not child colours. `#F1EFE8` bg · `#5F5E5A` text. |
| 4 | No points badge | Reflection entries never show a points badge. Nothing to earn or lose. |
| 5 | Full entry on tap | Same interaction as child entries: tap → expand → edit/delete available. |
| 6 | Not in child profile | Structurally impossible by design — `parentReflections` store is never queried by the profile screen. |
| 7 | v1.1: mood trend chart | 30-day parent mood distribution `<canvas>` chart at top of My Journey view. No benchmarks, no comparisons. |

> **Privacy guarantee:** `reflection.js` never imports from or writes to `logbook.js`. The child profile screen has no code path to `parentReflections`. This is a structural guarantee, not a UI-level one.

---

### 4.3 Parent mood tag design rationale

| Tag | What it captures | Why included |
|---|---|---|
| `patient` | Stayed calm under pressure; did not escalate | Positive anchor. Seeing "patient" logged reinforces that the parent does show up well. Balances "reactive". |
| `present` | Mentally and emotionally available; not distracted | Captures quality of attention, not just physical presence. Many parents are there physically but absent mentally. |
| `reactive` | Responded before thinking; raised voice; snapped | Hardest tag to tap. Its presence normalises difficult moments without labelling them as failures. First step toward change. |
| `distracted` | Physically present but mentally elsewhere — work, phone, worry | Separate from reactive. Distracted ≠ snapped. Different pattern, different reflection. |
| `tired` | Functioning below capacity due to exhaustion | Included deliberately. Normalises parental fatigue. Explains (without excusing) reactive or distracted behaviour. |

**Tags deliberately excluded:** `bad`, `failed`, `angry`, `guilty` — these are evaluative or emotionally loaded. They encourage rumination over reflection.

---

### 4.4 Guided prompts

Prompts are optional text chips below the free-text area in reflection mode. Not required fields — they exist for parents who stare at a blank field and don't know where to start.

| Prompt | Psychological purpose |
|---|---|
| "What went well today as a parent?" | Anchors reflection in positive behaviour first. Prevents pure self-criticism spiral. |
| "What would you do differently tomorrow?" | Forward-facing and constructive. "Would do differently" implies learning, not failure. "Tomorrow" implies agency. |
| "What did your child need from you today that you found hard to give?" | Builds empathy. Shifts from self-focus to relational focus. The most psychologically sophisticated prompt. |

Prompts rotate weekly (4-week rotation = 12 total). Stored in `assets/data/reflection-prompts.json` — no network call.

---

## 5. Interaction patterns

### 5.1 Touch target standards

All interactive elements meet WCAG 2.1 AA minimum touch target size (44×44pt).

| Component | Minimum size | Note |
|---|---|---|
| Primary buttons | 48px height, full width | Save, Continue, primary CTA |
| Mood chips (child) | 44px height | Flex row, equal widths |
| Mood chips (parent) | 44px height | Same as child mood chips |
| Child selector chips | 36px height | Secondary selection — acceptable |
| FAB | 46px diameter | Floating placement compensates |
| Bottom nav items | Full tab width × 56px | Entire tab area is tappable |
| Back button | 30px circle (v1) → 44px (v1.1) | Flagged for v1.1 if miss-tap rate high |

### 5.2 State transitions

| Transition | Behaviour |
|---|---|
| Chip selection | Instant fill — no animation. Speed beats delight on frequent interactions. |
| Screen navigation | Slide-right (forward) · slide-left (back). Matches native mobile. |
| Entry type toggle | Instant — child selector animates out, parent mood tags animate in. CSS only. |
| Save confirmation | Green toast `"Entry saved"` at bottom for 2 seconds. No modal, no blocking. |
| Reflection save | Green toast `"Reflection saved"` — same treatment, different copy. |
| Loading state | Not applicable in v1 — IndexedDB writes are fast. Spinner inside button if > 200ms. |
| Error state | Red toast `"Could not save — please try again"`. Entry remains in form for retry. |

### 5.3 Empty states

| Screen / state | Message and action |
|---|---|
| Home — no children | Large centred icon + "Add your first child to begin" + primary button. No nav visible until ≥ 1 child exists. |
| Home — no logs yet | "No logs yet — tap + to write your first entry" + arrow pointing at FAB. |
| History — no results | "No entries match this filter" + clear-filters link. Never shows a blank screen. |
| History — My Journey empty | "No reflections yet — tap + and choose 'About myself' to start." |
| Profile — no points yet | Chart shows 8 empty bars + "Points will appear here as you award them." |

---

## 6. Accessibility requirements

Target: **WCAG 2.1 Level AA**. Accessibility audit scheduled for Days 17 (v1.1 sprint).

| Requirement | Implementation | Test method |
|---|---|---|
| Colour contrast (text) | All body text: `#444441` on `#FAF9F6` — ratio 8.1:1 | Contrast checker pre-commit |
| Colour contrast (UI) | Buttons, chips: minimum 4.5:1 against background | Manual check per component |
| Touch targets | Minimum 44×44pt per WCAG 2.5.5 | Physical device thumb-tap test |
| Screen reader labels | All icon-only elements have `aria-label`; decorative icons `aria-hidden="true"` | VoiceOver (iOS) + TalkBack (Android) |
| Focus management | Logical tab order; visible focus rings on all interactive elements | Keyboard navigation in desktop browser |
| Motion sensitivity | All transitions respect `prefers-reduced-motion` media query | Enable reduced motion in OS settings |
| Semantic HTML | Buttons are `<button>`, inputs are `<input>`, lists are `<ul>/<li>` | HTML validator |

```css
/* Always include this in app.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. v2.0 design considerations

These are deferred. Documented here so v1.0 architecture does not accidentally close them off.

- **Child-facing display mode** — full-screen read-only view shown to the child by the parent. Large type, avatar, points total, badge collection. No data model changes needed.
- **Sibling comparison view** — side-by-side age-normalised scores. Must use percentile display, not raw points. Never show raw scores side-by-side between siblings.
- **Mini-games per age group** — one offline interactive game per Piaget stage. Plain JS/HTML canvas. Strictly one game per age band.
- **Printable year-in-review** — canvas-rendered PDF of a child's full year. All log entries, mood chart, points chart, badge timeline.
- **Optional cloud sync** — E2E encrypted, parent-controlled. Must not break no-server guarantee for users who don't opt in.
- **Dark mode** — warm-white palette (`#FAF9F6`) needs a warm-dark equivalent. Not a simple CSS variable invert — requires a separate colour token set.
- **AI reflection insights (v2 opt-in)** — Anthropic API to surface gentle private insights on parent reflection entries. Always opt-in, clearly labelled as AI-generated. Architecture already supports this (clean separate `parentReflections` store).

---

## 8. Open design questions

Update this table as decisions are made.

| ID | Question | Impact if unresolved | Priority |
|---|---|---|---|
| DQ-01 | Should children ever see their own score, or is the app parent-only? | Determines whether child-facing display is v1 or v2; how points are framed on profile | High |
| DQ-02 | Do siblings share a visible leaderboard or stay fully separate? | Home screen sibling view design; psychological risk if poorly done | High |
| DQ-03 | What is the icon set for v1 — Tabler outline or a custom set? | Tabler already loaded in prototype. Custom = design time but more brand-distinctive. | Medium |
| DQ-04 | Onboarding: add multiple children, or only one? | Multiple = longer first-run but less friction later | Medium |
| DQ-05 | Does v1 support RTL languages (Arabic, Hebrew)? | RTL requires CSS logical properties throughout — must be designed in from Sprint 1 | High |
| DQ-06 | Both co-parents write reflections, or only the primary parent? | Multi-parent privacy design needed before v1.1 QR sync ships | High |
| DQ-07 | Should guided prompts be reviewed by a licensed family therapist before shipping? | Prompts that inadvertently surface distress have no support pathway in the app | High |
| DQ-08 | Optional: link a reflection entry to a specific child? | Deferred to v2. If implemented: optional, never shown on child profile. | Low |

---

## 9. Appendix: colour tokens

```css
/* ── App tokens ─────────────────────────────────────────── */
--color-ink:        #2C2C2A;  /* primary text, buttons, active nav */
--color-bg:         #FAF9F6;  /* app background (warm white) */
--color-surface:    #F1EFE8;  /* card backgrounds, secondary fills */
--color-border:     #E8E6DF;  /* card borders */
--color-muted:      #888780;  /* secondary text, dates, labels */
--color-mid:        #D3D1C7;  /* dividers, empty chart bars */

/* ── Semantic ────────────────────────────────────────────── */
--color-accent:     #0F6E56;  /* heading 3, badges, points indicators */
--color-amber-bg:   #FAEEDA;  /* psychology suggestion cards */
--color-amber-tx:   #633806;  /* text on amber backgrounds */
--color-green-bg:   #E1F5EE;  /* success, points badge */
--color-green-tx:   #085041;  /* text on green backgrounds */

/* ── Child avatar colours ────────────────────────────────── */
--child-purple-bg:  #EEEDFE;
--child-purple-tx:  #3C3489;
--child-purple-dot: #7F77DD;  /* history dot, chart bar */

--child-teal-bg:    #E1F5EE;
--child-teal-tx:    #085041;
--child-teal-dot:   #1D9E75;

--child-coral-bg:   #FAECE7;
--child-coral-tx:   #712B13;
--child-coral-dot:  #D85A30;

--child-amber-bg:   #FAEEDA;
--child-amber-tx:   #633806;
--child-amber-dot:  #BA7517;

/* ── Parent reflection (neutral, never child-coloured) ───── */
--reflect-bg:       #F1EFE8;
--reflect-tx:       #5F5E5A;
--reflect-icon:     #888780;
```

---

## 10. Appendix: typography

```css
/* Load in index.html <head> */
/* <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"> */

/* ── Type scale ──────────────────────────────────────────── */
--font-display:     'Fraunces', serif;    /* logo, headings, greetings */
--font-body:        'DM Sans', sans-serif; /* all functional UI */

/* Display usages */
/* App logo:       Fraunces 500, 26px, #2C2C2A */
/* Screen headings: Fraunces 500, 20px, #2C2C2A */
/* Italic greeting: Fraunces 400 italic, 15px, #2C2C2A */

/* Body usages */
/* Body text:     DM Sans 400, 13px, #444441, line-height 1.5 */
/* Labels:        DM Sans 400, 11px, #888780, uppercase, letter-spacing 0.07em */
/* Micro text:    DM Sans 400, 10px, #888780 */
/* Buttons:       DM Sans 500, 13px */
/* Stat numbers:  Fraunces 500, 20px, #2C2C2A */
```

---

## 11. Appendix: file structure reference

```
kidchronicle/
├── index.html                      ← single entry point
├── manifest.json                   ← PWA manifest
├── service-worker.js               ← offline asset caching
│
├── css/
│   ├── reset.css                   ← CSS reset / normalise
│   ├── app.css                     ← main styles, CSS tokens, layout
│   └── themes.css                  ← child avatar colour tokens
│
├── js/
│   ├── app.js                      ← router, screen management, app init
│   ├── storage.js                  ← IndexedDB + localStorage abstraction
│   │                                  Object stores: logEntries, pointsEvents,
│   │                                                 parentReflections
│   ├── profiles.js                 ← family + child profile CRUD
│   │                                  calcAge(dateOfBirth) utility
│   ├── logbook.js                  ← child log entry CRUD
│   │                                  addEntry(), getEntries(), editEntry(),
│   │                                  deleteEntry()
│   ├── reflection.js               ← parent self-reflection CRUD
│   │                                  NEVER imports from logbook.js
│   │                                  addReflection(), getReflections(),
│   │                                  deleteReflection()
│   ├── points.js                   ← awardPoints(), getTotalPoints(),
│   │                                  getStreakCount(), categories CRUD
│   ├── psychology.js               ← getSuggestions(childAge, hasSiblings)
│   │                                  age filter, recency exclusion,
│   │                                  returns 3 suggestions per call
│   ├── charts.js                   ← canvas bar charts (no library)
│   │                                  renderPointsChart(childId, canvasEl)
│   │                                  renderMoodChart(childId, canvasEl)
│   │                                  renderParentMoodChart(canvasEl)
│   └── export.js                   ← JSON export (all stores) + import
│                                      with schema validation
│
└── assets/
    ├── icons/                      ← PWA icons: 192px, 512px
    ├── avatars/                    ← SVG child avatar options (6 colours)
    └── data/
        ├── suggestions.json        ← psychology engine content pool
        │                              30+ entries per age band:
        │                              2–3, 4–6, 7–11, 12–14, 15+
        └── reflection-prompts.json ← 12 prompts (3 per week, 4-week rotation)
```

---

## Module dependency rules

```
app.js
 ├── imports: storage.js, profiles.js
 ├── imports: logbook.js       (child log entries only)
 ├── imports: reflection.js    (parent reflections only — SEPARATE)
 ├── imports: points.js
 ├── imports: psychology.js
 ├── imports: charts.js
 └── imports: export.js

logbook.js
 └── imports: storage.js ONLY
     ✗ NEVER imports reflection.js

reflection.js
 └── imports: storage.js ONLY
     ✗ NEVER imports logbook.js
     ✗ NEVER writes to logEntries store
```

---

*KidChronicle · kiren-labs · UX Wireframe & Design Specification v1.1 · May 2026*
*Keep this file at `UX_WIREFRAMES.md` in the repo root alongside `PROJECT_PLAN.md`.*