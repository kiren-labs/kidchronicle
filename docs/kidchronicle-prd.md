# KidChronicle — Product & Architecture Document

**Version:** 0.3 (Draft)
**Status:** In review
**Last updated:** May 2026
**Author:** [OPEN: Add your name]
**Tagline:** Your child's story, one day at a time.
**Sister product:** FinChronicle (kiren-labs.github.io/finchronicle)
**Separate product:** Kept intentionally separate — different user group, different UX, different emotional context.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals and Success Criteria](#2-goals-and-success-criteria)
3. [Stakeholders and Users](#3-stakeholders-and-users)
4. [Functional Requirements](#4-functional-requirements)
5. [Architecture Constraints](#5-architecture-constraints)
6. [System Architecture](#6-system-architecture)
7. [Data Model](#7-data-model)
8. [Module Specifications](#8-module-specifications)
9. [Psychology Engine Design](#9-psychology-engine-design)
10. [Parent Self-Reflection Layer](#10-parent-self-reflection-layer)
11. [Key Architecture Decisions](#11-key-architecture-decisions)
11. [Competitive Landscape](#11-competitive-landscape)
12. [Risks and Mitigations](#12-risks-and-mitigations)
13. [Quality Requirements](#13-quality-requirements)
14. [Phased Delivery Plan](#14-phased-delivery-plan)
15. [Open Questions](#15-open-questions)
16. [Glossary](#16-glossary)

---

## 1. Project Overview

### 1.1 What this is

A Progressive Web App (PWA) for parents to log daily interactions with their children, award points for good deeds, track behaviour patterns over time, and receive age-appropriate activity and game suggestions based on each child's profile.

The app runs entirely in the browser with no server, no account, and no dependencies. All data is stored locally on the parent's device and can be exported as JSON.

### 1.2 The problem it solves

Parents have no lightweight, private tool that combines three things in one place:

- a running diary of what happened today with each child
- a gamified, customisable scoring system for good behaviour
- age-aware suggestions grounded in child development research

Existing apps (Joon, S'moresUp, OurHome, Thumsters, iRewardChart) cover one or two of these, but none cover all three, and all require an account or a subscription.

### 1.3 One-sentence pitch

A private, offline-first KidChronicle where parents record their children's days, award points for good deeds, and get age-appropriate activity ideas — with no server, no login, and no cost.

---

## 2. Goals and Success Criteria

| # | Goal | How we measure it |
|---|------|-------------------|
| G-1 | Parent can add a log entry in under 30 seconds | Manual timing test on first-run device |
| G-2 | All data survives browser refresh and device restart | Automated test: write → reload → read |
| G-3 | Works fully offline after first load | Chrome DevTools: offline mode, all features functional |
| G-4 | Supports a family with 1–5 children of different ages | Functional test with 5 child profiles |
| G-5 | Age-appropriate task suggestions differ meaningfully by age group | Content review against Piaget / Erikson stages |
| G-6 | Parent logbook history is browsable by child and by date | UI test: scroll 30 days back for any child |

---

## 3. Stakeholders and Users

### 3.1 Primary users

| Role | Description | Key need |
|------|-------------|----------|
| Parent (logger) | Uses the app daily to record and score | Fast entry, reliable storage, history view |
| Parent (reviewer) | Reviews history, adjusts scores | Clear timeline, editable entries |
| Child (indirect) | Sees their score and earned badges | Motivating display, fair scoring |

### 3.2 Secondary users

| Role | Description |
|------|-------------|
| Co-parent | Second parent on a different device — v2 concern |
| Extended family | Grandparents who may view shared exports — v3 concern |

### 3.3 What children are not

Children are not app users in the primary sense. They see a display view shown to them by the parent. They do not log entries or award their own points.

---

## 4. Functional Requirements

### 4.1 Must have (v1)

| ID | Requirement |
|----|-------------|
| FR-01 | Parent can create a family profile with 1–5 child profiles |
| FR-02 | Each child profile stores: name, date of birth (for age calculation), avatar colour, sibling flag |
| FR-03 | Parent can add a daily log entry per child: free text, date, mood tag (5 options), optional category tags |
| FR-04 | Parent can award points to a child for a named good deed, with a custom point value |
| FR-05 | Point categories are customisable per family (defaults provided) |
| FR-06 | Each child has a running total and a points history chart |
| FR-07 | Parent can browse all past log entries per child, sorted by date |
| FR-08 | App works fully offline after first load (PWA with service worker) |
| FR-09 | All data stored locally; no network calls except initial asset load |
| FR-10 | Parent can export all data as a JSON file |
| FR-11 | Psychology engine suggests 3 age-appropriate tasks or activities per child per week |
| FR-12 | Parent can write a self-reflection entry (separate entry type from child log) |
| FR-13 | Parent self-reflection entries have their own mood tags: patient, present, reactive, distracted, tired |
| FR-14 | Parent reflection entries are stored separately and never shown alongside child entries |
| FR-15 | A "My Journey" section in History shows only parent reflection entries, chronological |

### 4.2 Should have (v1 stretch / v2)

| ID | Requirement |
|----|-------------|
| FR-16 | Sibling fairness view: age-normalised points comparison |
| FR-17 | Streak tracking: consecutive days with a log entry or a good deed |
| FR-18 | Badge system: milestones trigger visual badges (first 100 points, 7-day streak, etc.) |
| FR-19 | Mood trend chart: mood tag distribution over a rolling 30-day window |
| FR-20 | Parent mood trend chart: parent reflection mood distribution over rolling 30 days |
| FR-21 | One built-in mini-game per age group, playable offline |

### 4.3 Will not have (v1)

| ID | Requirement | Reason |
|----|-------------|--------|
| FR-X1 | Server-side sync between co-parents | Requires backend; deferred to v2 |
| FR-X2 | Push notifications | Requires service worker push API and user permission; v2 |
| FR-X3 | Photo attachments | Increases storage complexity; v2 |
| FR-X4 | Allowance / money tracking | Out of scope — other apps do this well |
| FR-X5 | Child-facing login or separate child account | Security and complexity; v2 |

---

## 5. Architecture Constraints

| Type | Constraint | Reason |
|------|-----------|--------|
| Technical | No server, no backend, no database | Privacy by design; avoids COPPA/GDPR-K server obligations |
| Technical | No npm, no Node, no build step | Stated requirement; runs as plain HTML/CSS/JS |
| Technical | No external JS libraries at runtime | Stated requirement; all logic hand-written |
| Technical | Must work as installable PWA | Offline-first; home screen install on iOS and Android |
| Legal | No transmission of child data off-device | COPPA (US) / GDPR-K (EU) compliance |
| Legal | Privacy policy required even for local-only apps | App store submission requirement |
| Design | First log entry must be achievable in under 30 seconds | Habit formation depends on low friction |
| Design | Must work on mobile screens (375px+) | Primary use case is a parent on a phone |

---

## 6. System Architecture

### 6.1 Context diagram

```
┌─────────────────────────────────────────────────┐
│                  Parent's device                │
│                                                 │
│   ┌─────────────────────────────────────────┐  │
│   │           KidChronicle            │  │
│   │                                         │  │
│   │  ┌──────────┐  ┌──────────┐            │  │
│   │  │  App UI  │→ │  App JS  │            │  │
│   │  └──────────┘  └────┬─────┘            │  │
│   │                     │                  │  │
│   │              ┌──────▼──────┐           │  │
│   │              │ localStorage │           │  │
│   │              │ IndexedDB    │           │  │
│   │              └─────────────┘           │  │
│   └─────────────────────────────────────────┘  │
│                                                 │
│   Service Worker (caches assets, enables        │
│   offline use after first load)                 │
└─────────────────────────────────────────────────┘

External: None. No APIs, no analytics, no CDN at runtime.
Initial asset load only (HTML, CSS, JS files).
```

### 6.2 Building blocks (Level 1)

```
┌─────────────────────────────────────────────────────────┐
│                    KidChronicle                   │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐                   │
│  │   Profile     │   │   Logbook    │                   │
│  │   Manager    │   │   Engine     │                   │
│  └──────┬───────┘   └──────┬───────┘                   │
│         │                  │                           │
│  ┌──────▼───────┐   ┌──────▼───────┐                   │
│  │   Points &   │   │  Psychology  │                   │
│  │   Rewards    │   │   Engine     │                   │
│  └──────┬───────┘   └──────┬───────┘                   │
│         │                  │                           │
│         └────────┬─────────┘                           │
│                  ▼                                      │
│         ┌────────────────┐                             │
│         │  Storage Layer │                             │
│         │ (localStorage/ │                             │
│         │  IndexedDB)    │                             │
│         └────────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

### 6.3 File structure

```
/
├── index.html          ← Single entry point
├── manifest.json       ← PWA manifest (name, icons, theme)
├── service-worker.js   ← Asset caching for offline use
├── css/
│   ├── reset.css
│   ├── app.css
│   └── themes.css      ← Child avatar colour themes
├── js/
│   ├── app.js          ← Router and app initialisation
│   ├── storage.js      ← All read/write to localStorage/IndexedDB
│   ├── profiles.js     ← Family and child profile logic
│   ├── logbook.js      ← Child log entry creation and retrieval
│   ├── reflection.js   ← Parent self-reflection entries (separate module)
│   ├── points.js       ← Scoring, categories, history
│   ├── psychology.js   ← Age-based task/game suggestion engine
│   ├── charts.js       ← Points history and mood trend charts (canvas)
│   └── export.js       ← JSON export / import
└── assets/
    ├── icons/          ← PWA icons (192px, 512px)
    └── avatars/        ← SVG avatar options
```

---

## 7. Data Model

All data is stored as JSON in localStorage, keyed by namespace. For log entries and points history (potentially large), IndexedDB is used.

### 7.1 Family profile

```json
{
  "family": {
    "id": "fam_01",
    "name": "The Johnsons",
    "createdAt": "2026-05-11T10:00:00Z",
    "pointCategories": [
      { "id": "cat_01", "label": "Helped someone", "defaultPoints": 10 },
      { "id": "cat_02", "label": "Tidied room", "defaultPoints": 5 },
      { "id": "cat_03", "label": "Kind words", "defaultPoints": 8 },
      { "id": "cat_04", "label": "Homework done", "defaultPoints": 7 },
      { "id": "cat_05", "label": "Custom", "defaultPoints": 5 }
    ]
  }
}
```

### 7.2 Child profile

```json
{
  "child": {
    "id": "child_01",
    "familyId": "fam_01",
    "name": "Layla",
    "dateOfBirth": "2018-03-15",
    "avatarColor": "purple",
    "hasSiblings": true,
    "createdAt": "2026-05-11T10:00:00Z"
  }
}
```

Age is always calculated at runtime from `dateOfBirth` — never stored directly, as it changes.

### 7.3 Log entry

```json
{
  "logEntry": {
    "id": "log_001",
    "childId": "child_01",
    "date": "2026-05-11",
    "text": "Layla helped her brother with his puzzle without being asked. Really proud of her.",
    "moodTag": "proud",
    "tags": ["kindness", "sibling"],
    "createdAt": "2026-05-11T20:15:00Z",
    "updatedAt": "2026-05-11T20:15:00Z"
  }
}
```

**Mood tags (fixed set of 5):** `great`, `good`, `neutral`, `tired`, `proud`

### 7.4 Points event

```json
{
  "pointsEvent": {
    "id": "pts_001",
    "childId": "child_01",
    "categoryId": "cat_01",
    "label": "Helped brother with puzzle",
    "points": 10,
    "date": "2026-05-11",
    "awardedAt": "2026-05-11T20:16:00Z"
  }
}
```

Running total is computed at read time by summing all events — never stored as a mutable field, to avoid corruption.

### 7.5 Parent reflection entry

Parent reflection entries are a distinct entry type. They are **never** stored in the same object store as child log entries. They have no `childId` — they belong to the parent, not to any child.

```json
{
  "parentReflection": {
    "id": "ref_001",
    "familyId": "fam_01",
    "date": "2026-05-11",
    "text": "I was impatient at bedtime tonight. Layla was tired and I raised my voice. I want to try the 5-second pause tomorrow before I respond.",
    "moodTag": "reactive",
    "prompt": "What would you do differently tomorrow?",
    "createdAt": "2026-05-11T21:30:00Z",
    "updatedAt": "2026-05-11T21:30:00Z"
  }
}
```

**Parent mood tags (fixed set of 5):** `patient`, `present`, `reactive`, `distracted`, `tired`

These are deliberately **descriptive, not evaluative**. There is no score, no rating, no percentage. Research on constructive self-reflection (Fonagy, 1991; Pennebaker, 1997) shows that evaluative self-scoring creates shame rather than growth. Descriptive mood tags allow honest capture without self-judgment.

**Guided prompts (optional, shown below the text field):**
- "What went well today as a parent?"
- "What would you do differently tomorrow?"
- "What did your child need from you today that you found hard to give?"

Prompts are suggestions only — the parent can ignore them and write freely.

### 7.6 Storage keys (localStorage)

| Key | Value |
|-----|-------|
| `kc_family` | Family profile object (JSON string) |
| `kc_children` | Array of child profile objects |
| `kc_settings` | App preferences (language, theme, etc.) |

Log entries, points events, and parent reflection entries are stored in IndexedDB under the `kidchronicle` database:

| Object store | Indexed by | Used for |
|---|---|---|
| `logEntries` | `childId`, `date` | Child log entries |
| `pointsEvents` | `childId`, `date` | Points awards |
| `parentReflections` | `date` | Parent self-reflection entries — no childId |

---

## 8. Module Specifications

### 8.1 Profile Manager

**Responsibility:** Create, read, update, and delete family and child profiles.

**Key behaviours:**
- First launch: shows onboarding flow (family name → add first child → done)
- Child profile requires: name, date of birth, avatar colour
- Optional: sibling flag (used by psychology engine and fairness view)
- Maximum 5 children per family (v1 limit, revisable)
- Deleting a child profile asks for confirmation and deletes all associated log entries and points events

### 8.2 Logbook Engine

**Responsibility:** Create, display, edit, and delete log entries.

**Key behaviours:**
- Default date is today; parent can back-date up to 365 days
- Text field: free input, no minimum or maximum length
- Mood tag: single selection from 5 fixed options
- Optional tags: parent can add up to 3 freetext tags per entry
- History view: paginated list, 20 entries per page, newest first
- Search: filter by child, date range, mood tag, or freetext keyword

### 8.3 Points and Rewards

**Responsibility:** Award points, display totals, show history, manage categories.

**Key behaviours:**
- Parent selects child → selects category → optionally edits label and point value → confirms
- Points are additive only in v1 (no deductions — deductions require careful psychological design, deferred)
- Running total displayed prominently on each child's profile card
- History chart: bar chart (canvas, no library) of points per week, rolling 13 weeks
- Badge triggers: 50 pts, 100 pts, 250 pts, 500 pts, first entry, 7-day streak (v1 stretch)

### 8.4 Storage Layer

**Responsibility:** All read and write operations against localStorage and IndexedDB.

**Key behaviours:**
- All writes are wrapped in try/catch; failure shows a non-blocking toast message
- On first load, checks for existing data and migrates schema if version has changed
- Export function: serialises all stores to a single JSON file, offered as a download
- Import function: validates JSON structure before writing, warns on schema mismatch

### 8.5 History Timeline

**Responsibility:** Parent-facing view of all log entries and points for a selected child.

**Key behaviours:**
- Timeline view: interleaved log entries and points events, sorted by date
- Filter bar: date range picker, mood tag filter, points-only toggle
- Each entry is expandable; shows full text and tags
- Points summary strip at the top: total, this week, this month

### 8.6 Parent Self-Reflection Engine

**Responsibility:** Create, store, display, and reflect on parent self-reflection entries. Completely separate from the child logbook at every layer — data model, UI, and history view.

**Key behaviours:**

- Entry type toggle on the Log Entry screen: "About my child" (default) ↔ "About myself as a parent." Toggle is a subtle pill switch at the top of the screen, not a prominent tab — it is secondary to the child log, not equal.
- When "About myself" is selected, the child selector disappears, the mood tags change to the parent set (patient, present, reactive, distracted, tired), and 3 optional guided prompts appear below the text field.
- Parent entries are written to the `parentReflections` IndexedDB store — never to `logEntries`.
- **No scoring, no rating, no self-evaluation number.** Mood tags only. This is a hard design rule backed by psychological research on constructive vs ruminative self-reflection.
- "My Journey" tab within the History screen (a secondary filter, not a new nav tab) shows only parent reflection entries, newest first.
- Parent reflection entries are **visually distinct** from child entries in all views — they use a muted neutral palette (no child colour coding), and carry a small "parent" icon. If a co-parent imports data via QR sync (v1.1), they see only their own reflection entries, not the other parent's.
- Edit and delete work identically to child log entries.
- Parent mood trend chart (FR-20) is a v1.1 stretch feature: a 30-day rolling distribution of parent mood tags, shown only in the "My Journey" view.

**Privacy note:** Parent reflection entries are the most sensitive data in the app. If a child ever sees the parent's screen, reflection entries must not be visible at a glance. The "My Journey" section is accessed via a secondary filter in History, not a top-level tab — it is naturally less discoverable.

---

## 9. Psychology Engine Design

### 9.1 Purpose

Given a child's age (calculated from date of birth) and sibling status, the engine surfaces 3 suggested activities or tasks per week. Suggestions are meant to be read by the parent and proposed to the child — they are not automated or shown directly to the child.

### 9.2 Theoretical framework

Suggestions are mapped to developmental stages from two frameworks:

| Framework | What it contributes |
|-----------|-------------------|
| Piaget (cognitive stages) | What kind of thinking and problem-solving is appropriate |
| Erikson (psychosocial stages) | What social and emotional themes matter at this age |

This is not a clinical tool. All suggestions carry the disclaimer: "These are general ideas based on child development research, not personalised clinical advice."

### 9.3 Age groups and stage mapping

| Age group | Piaget stage | Erikson stage | Focus themes |
|-----------|-------------|---------------|--------------|
| 2–3 years | Sensorimotor (late) | Autonomy vs. shame | Simple choices, physical play, naming feelings |
| 4–6 years | Pre-operational | Initiative vs. guilt | Imaginative play, simple helping tasks, creativity |
| 7–11 years | Concrete operational | Industry vs. inferiority | Skill building, real tasks with visible results, team games |
| 12–14 years | Formal operational (early) | Identity vs. role confusion | Responsibility, peer collaboration, reflection tasks |
| 15+ years | Formal operational | Identity vs. role confusion | Autonomy tasks, project-based goals, self-assessment |

### 9.4 Sibling dynamics rules

When `hasSiblings` is true, the engine adds a sibling-aware suggestion each week — a cooperative task both children can do together, scaled to the younger child's ability.

Age-normalised scoring: the points display for families with siblings shows each child's score as a percentile within their age group's typical range, not as a raw number side by side. This prevents a 12-year-old appearing to "beat" a 5-year-old.

### 9.5 Suggestion data structure

Suggestions are stored as a static JSON file bundled with the app (`js/suggestions.json`). No network call required.

```json
{
  "suggestions": [
    {
      "id": "sug_001",
      "ageMin": 4,
      "ageMax": 6,
      "siblingRequired": false,
      "category": "creativity",
      "title": "Draw your favourite animal",
      "description": "Ask them to draw their favourite animal and then tell you three things about it. Encourages imagination and verbal explanation.",
      "eriksonTheme": "initiative",
      "piagetConcept": "symbolic play"
    }
  ]
}
```

### 9.6 Selection algorithm

1. Filter suggestions where `ageMin <= childAge <= ageMax`
2. Filter by `siblingRequired` matching the child's `hasSiblings` value (include non-sibling suggestions always; add sibling suggestions only when applicable)
3. Exclude suggestions shown in the last 4 weeks for this child
4. Randomly select 3 from remaining pool
5. If pool has fewer than 3, allow repeats from last 4 weeks

[OPEN: Suggestion pool needs content written. Suggested owner: someone with child development background, or a parent review panel. Target: 30+ suggestions per age group.]

---

## 10. Parent Self-Reflection Layer

### 10.1 Why this feature exists

KidChronicle started as a one-sided log — parent records what the child did. But parenting is a relationship. A child's behaviour and emotional state are shaped as much by how the parent showed up as by anything the child did independently.

The parent self-reflection layer adds the missing half: a private space for parents to record how *they* showed up, notice patterns in their own behaviour, and grow alongside their children. This is grounded in the psychological concept of **reflective functioning** (Fonagy, 1991) — a parent's ability to think about their own mental states and how those states affect their child. It is one of the strongest predictors of secure parent-child attachment.

This is not a guilt machine. It is not a score. It is a journal.

### 10.2 Design constraints (non-negotiable)

| Constraint | Reason |
|---|---|
| No self-scoring or ratings | Evaluative self-scoring creates shame and rumination, not growth. Research: Pennebaker (1997), constructive journaling literature. |
| Descriptive mood tags only | "Reactive" is a description. "2/10 as a parent" is a judgment. Descriptions enable reflection; judgments create avoidance. |
| Completely separate data store | Child log entries must remain a warm, celebration-focused record. Parent reflection entries must not pollute that space. |
| Not prominent in navigation | Parent reflection is a secondary feature. It must not be a top-level nav tab. It lives behind a toggle and a secondary history filter. |
| Never visible to children | The UI must make accidental child exposure structurally impossible, not just unlikely. |
| Co-parent entries are private | If two parents use the app, each parent's reflection entries are never shown to the other. Personal growth is not a shared audit. |

### 10.3 User flow

```
Parent opens Log Entry screen
    ↓
Default state: "About my child" (existing flow, unchanged)
    ↓
Parent taps toggle: "About myself"
    ↓
Child selector disappears
Mood tags change to: patient | present | reactive | distracted | tired
3 optional guided prompts appear below text field
    ↓
Parent writes freely (prompts are optional, not required)
    ↓
Taps "Save reflection"
    ↓
Written to parentReflections IndexedDB store
    ↓
Appears in "My Journey" filter in History screen
```

### 10.4 Guided prompts

Prompts are shown below the text field as soft suggestions. The parent can write anything — the prompts are not required fields. They exist to help parents who stare at a blank field and don't know where to start.

| Prompt | Psychological purpose |
|---|---|
| "What went well today as a parent?" | Anchors reflection in positive behaviour first — prevents pure self-criticism spiral |
| "What would you do differently tomorrow?" | Forward-facing, constructive. Not "what did I do wrong" but "what could I do better" |
| "What did your child need from you today that you found hard to give?" | Builds empathy and awareness of child's emotional needs |

Prompts rotate weekly so they stay fresh. Stored in `reflection-prompts.json` bundled with the app — no network call.

### 10.5 Parent mood tags

| Tag | What it captures |
|---|---|
| `patient` | Stayed calm under pressure, didn't escalate |
| `present` | Was mentally and emotionally available, not distracted |
| `reactive` | Responded before thinking, raised voice, snapped |
| `distracted` | Physically present but mentally elsewhere — work, phone, worry |
| `tired` | Functioning below capacity due to exhaustion — not a failure, just a state |

`tired` is included deliberately. It is the most honest tag many parents will use, and normalising it reduces shame. Tiredness is not a character flaw.

### 10.6 "My Journey" history view

The "My Journey" view is accessible via a filter chip in the History screen: switching from "All children / child names" to "My journey." It is not a new screen and not a new nav tab.

**Contents:**
- Chronological list of parent reflection entries, newest first
- Each entry shows: date, mood tag (coloured neutral grey — no child colour), text preview
- Expandable to full entry
- Edit and delete work identically to child entries
- v1.1 stretch: a 30-day mood trend chart showing distribution of parent mood tags

**What is deliberately absent:**
- No comparison to child entries
- No streak counter (streaks on parent reflection would create pressure, not encouragement)
- No points or gamification of any kind
- No sharing or export of parent entries separately (they are included in the full JSON export but not in any sharable format)

### 10.7 v2.0 AI layer (planned, not v1)

In v2.0, the Anthropic API can be used to offer gentle, private insights on parent reflection entries — for example: "You've described feeling reactive on 4 of the last 7 Sundays. Would you like to explore what Sunday evenings look like for your family?" This is an opt-in feature, clearly labelled as AI-generated, and never surfaced without the parent explicitly requesting it. It is architected in v1 by keeping reflection entries in a clean, separate store.

---

## 11. Key Architecture Decisions

### ADR-01: No server, no backend

**Decision:** All data stored client-side. No API, no database, no user accounts.

**Reason:** Eliminates COPPA/GDPR-K server-side obligations. Eliminates hosting costs. Eliminates account friction for users. Eliminates single point of failure.

**Consequences:** Co-parent sync not possible in v1. Data is tied to one device and one browser. User must remember to export backups.

---

### ADR-02: No npm, no build step, no frameworks

**Decision:** Plain HTML, CSS, and vanilla JavaScript. No React, Vue, Svelte, Tailwind, or any compiled dependency.

**Reason:** Stated requirement. Also: zero dependency rot, zero build pipeline to maintain, directly auditable code.

**Consequences:** No component library. Charts must be hand-drawn on `<canvas>`. More verbose JS than framework equivalents. Worth it for the simplicity guarantee.

---

### ADR-03: localStorage for profiles and settings, IndexedDB for log entries and events

**Decision:** Small config objects go in localStorage (fast, synchronous). Log entries and points events go in IndexedDB (async, handles larger volumes, survives storage pressure eviction better).

**Reason:** localStorage has a 5–10 MB limit per origin and is synchronous — fine for config, risky for unbounded log history. IndexedDB handles large datasets and supports indexed queries (by childId, by date).

**Consequences:** Storage layer must abstract over two different APIs. IndexedDB has a more complex API; this is encapsulated entirely in `storage.js`.

---

### ADR-04: Age calculated at runtime, never stored

**Decision:** Store only `dateOfBirth`. Calculate `age` in years and months at runtime wherever needed.

**Reason:** Stored age becomes stale the moment the child has a birthday. Runtime calculation is always correct and costs nothing.

**Consequences:** Any function that uses age must call the age calculation utility. The psychology engine receives a fresh age on every call.

---

### ADR-05: Points are additive only in v1

**Decision:** No point deductions in v1. Points can only go up.

**Reason:** The over-justification effect in motivational psychology suggests that point deductions for negative behaviour can undermine intrinsic motivation. Positive reinforcement only is the safer default. Deductions can be added in v2 with explicit parent guidance.

**Consequences:** Parents who want to track negative behaviour must use log entries and mood tags only. Point total is always a cumulative score, never a live balance.

---

### ADR-06: Parent reflection entries stored in a separate IndexedDB object store

**Decision:** Parent self-reflection entries are written to a dedicated `parentReflections` object store, completely separate from `logEntries` and `pointsEvents`.

**Reason:** Child log entries are the warm, celebratory core of the app. Mixing parent reflection entries (which may contain difficult emotional content) into the same store risks accidental display in child-facing views, complicates query logic, and blurs the emotional separation between the two record types. Keeping them separate is a one-line architectural decision that eliminates an entire class of future bugs and UI errors.

**Consequences:** `reflection.js` is a standalone module. It never imports from or writes to `logbook.js`. The History screen queries both stores separately and renders them in separate UI sections. The JSON export includes both stores under clearly labelled keys: `childLogEntries` and `parentReflections`.

---

## 11. Competitive Landscape

| App | Strengths | What we do that they don't |
|-----|-----------|---------------------------|
| Joon | Psychologist-backed, age-aware tasks | Parent diary/logbook; no subscription; offline |
| S'moresUp | Polished gamification, smart home integration | Flexible scoring; parent memory layer; no paywall |
| OurHome | Multi-child, 500k+ downloads | Psychology engine; parent journal; offline-first |
| Thumsters | Positive + negative tracking, multi-child free | Historical log; sibling dynamics; age-normalisedscoring |
| Homey | Detailed allowance math | No bank link needed; offline; journal layer |
| iRewardChart | Long track record, good free tier | Age-appropriate logic; parent diary; no subscription |

**Our gap:** The combination of parent diary + age-aware psychology + sibling fairness + zero server does not exist in the market. The #1 complaint across competitors is that co-parents cannot sync — our v2 roadmap addresses this via QR-based JSON sync, no server required.

---

## 12. Risks and Mitigations

| ID | Risk | Impact | Probability | Mitigation |
|----|------|--------|-------------|-----------|
| R-01 | Parent abandons app within 2 weeks (habit drop-off) | High | High | First log entry must take under 30 seconds. Daily nudge via service worker notification (v2). Onboarding celebrates first entry. |
| R-02 | Sibling scoring creates resentment if raw scores shown together | High | Medium | Age-normalised display by default. Raw scores hidden in sibling view unless parent explicitly toggles. |
| R-03 | Psychology engine suggestions are inappropriate or harmful | High | Low | Label all suggestions as general guidance, not clinical advice. Add age range conservatively. Include a "not relevant" feedback button that filters future suggestions. |
| R-04 | localStorage/IndexedDB cleared by browser (storage pressure on iOS) | High | Medium | Warn users to export regularly. Show last-export date prominently. Consider using the StorageManager API to request persistent storage. |
| R-05 | Co-parent sync gap causes frustration | Medium | High | Document clearly as v2. Provide QR-based JSON export/import as a manual workaround in v1. |
| R-06 | Gamification backfire (over-justification effect) | Medium | Low | Points reinforce effort and character, not output. No deductions in v1. Avoid leaderboard framing. Include brief in-app guidance for parents. |
| R-07 | App store rejection for children's content without privacy policy | High | Medium | Write and include a clear privacy policy before submission. Emphasise local-only storage. |

---

## 13. Quality Requirements

| ID | Category | Scenario | Acceptance criterion |
|----|----------|----------|---------------------|
| QR-01 | Performance | Parent adds a log entry on a mid-range Android phone | Entry saved and UI updated in under 500ms |
| QR-02 | Reliability | Browser refreshed mid-session | All previously saved data intact on reload |
| QR-03 | Offline | Device goes offline after first load | All features remain functional; no error states |
| QR-04 | Usability | Parent opens app for first time | Can complete first log entry without reading instructions |
| QR-05 | Storage | Family uses app daily for 2 years (730 log entries, 2000 points events) | App remains responsive; no data loss |
| QR-06 | Privacy | App audited for network calls | Zero requests to external servers during normal use |
| QR-07 | Portability | User exports JSON and imports on a new device | All data present and correctly rendered |

---

## 14. Release Schedule and Delivery Plan

### 14.1 Summary

| Metric | Value |
|--------|-------|
| Total duration | 20 weeks |
| Releases | 3 (v1.0, v1.1, v2.0 planning) |
| Sprint cadence | 2-week sprints (10 sprints total) |
| Buffer weeks | 4 (20% of total — mandatory) |
| Milestone gates | 5 (block-and-hold; nothing ships without passing) |

Buffer weeks are not optional. They absorb iOS Safari service worker quirks, psychology content review cycles, and the inevitable pre-launch bug. Planning to 100% capacity is how projects slip.

---

### 14.2 Engineering Manager Principles

These principles govern the schedule and cannot be overridden by feature pressure:

**Storage first, UI never second.** Sprint 1 has zero UI work. `db.js` must be solid before any screen is built. Every PWA failure comes from building beautiful UI on a broken storage layer.

**Gate-based progress, not date-based.** Each milestone gate is a hard stop. The next phase cannot start until the current gate passes. "We'll fix it later" is how scope debt compounds into a broken product.

**Ship early, iterate with real users.** v1.0 ships at week 14. Six weeks of real parent feedback before v1.1 is built. Real users reveal what matters faster than any planning document.

**Risks are scheduled, not discovered.** Canvas chart complexity (Sprint 5) and psychology content review (Sprint 6) are flagged in the sprint where they land. Not at launch.

**iOS is tested separately.** Safari's service worker and IndexedDB behaviour differs materially from Chrome. Dedicated iOS test pass at M3 — not an afterthought.

---

### 14.3 Phase 1 — Foundation (v1.0) · Weeks 1–14 · 7 sprints

Goal: build the core daily-use loop. A parent can add a child, write a log entry, award points, and browse history — fully offline.

#### Sprint 1 — Weeks 1–2 · Infrastructure

| Task | Notes |
|------|-------|
| Repo setup, GitHub Pages deploy | kiren-labs/kidchronicle |
| `db.js` — IndexedDB wrapper (full CRUD) | Object stores: `logEntries`, `pointsEvents` |
| `localStorage` helpers for profiles and settings | Keys: `kc_family`, `kc_children`, `kc_settings` |
| PWA `manifest.json` and icons (192px, 512px) | Theme colour, display: standalone |
| `service-worker.js` skeleton | Asset list defined; caching logic in Sprint 6 |

**Gate M1 (end W2):** `db.js` reads, writes, deletes, and survives full browser reload. Both IndexedDB and localStorage tested. No other sprint starts until M1 passes.

---

#### Sprint 2 — Weeks 3–4 · Profiles

| Task | Notes |
|------|-------|
| `profiles.js` — family + child CRUD | Create, read, update, delete |
| Onboarding flow UI | Family name → add first child → done |
| Avatar colour picker (6 colours) | Stored as colour token, not hex |
| Age calculation utility | `calcAge(dateOfBirth)` → years + months at runtime |
| Child list view | Profile cards with name, age, avatar |

**Gate check (end W4):** Can create 3 children with different ages, reload browser, and see all 3 intact.

---

#### Sprint 3 — Weeks 5–6 · Logbook entry + parent reflection

| Task | Notes |
|------|-------|
| `logbook.js` — add log entry | Free text, mood tag, optional freetext tags |
| Mood tag selector UI | 5 fixed options: great, good, neutral, tired, proud |
| Date picker with back-date support | Default today; up to 365 days back |
| Entry saved to IndexedDB | Indexed by `childId` + `date` |
| `reflection.js` — parent reflection entry | Toggle on Log Entry screen: "About my child" ↔ "About myself" |
| Parent mood tags | patient, present, reactive, distracted, tired |
| Guided prompts display | 3 rotating optional prompts below text field |
| `parentReflections` IndexedDB store | Separate store — no `childId`, indexed by `date` only |

---

#### Sprint 4 — Weeks 7–8 · Logbook history

| Task | Notes |
|------|-------|
| History view — paginated list | 20 entries per page, newest first |
| Edit and delete entries | With confirmation on delete |
| Search and filter | By child, date range, mood tag, keyword |
| Per-child entry count badge | Shown on profile card |

**Gate check (end W8):** 30-day scroll test passes. Search returns correct results across 50+ test entries.

---

#### Sprint 5 — Weeks 9–10 · Points and export

| Task | Notes |
|------|-------|
| `points.js` — award points flow | Select child → category → confirm |
| Customisable point categories | Defaults provided; parent can rename/add |
| Running total per child | Computed at read time by summing events |
| Points history chart (`canvas`) | Bar chart, rolling 13 weeks, no library |
| `export.js` — JSON download | Full serialisation of all stores |

**Risk (Sprint 5):** Canvas chart implementation is the most technically uncertain piece in v1. Allow 2 extra days. If it runs long, defer to Sprint 7 and ship v1.0 without the chart — the data is still sound.

---

#### Sprint 6 — Weeks 11–12 · Psychology engine + offline

| Task | Notes |
|------|-------|
| `psychology.js` — suggestion engine | Age filter + sibling filter + recency exclusion |
| `suggestions.json` — content pool | Minimum 30 entries per age group; see OQ-07 |
| Weekly suggestion display (3 per child) | With "not relevant" dismiss button |
| Service worker — full offline caching | All assets cached on first load |
| iOS Safari service worker test | Separate test pass — behaviour differs from Chrome |

**Risk (Sprint 6):** `suggestions.json` content requires a human review pass for age-appropriateness. If content is not ready by W11, ship psychology engine with a minimal placeholder set and add full content in v1.1 patch.

**Gate M3 (end W12):** DevTools offline mode — all features fully functional with no network. iOS Safari offline confirmed. This gate must pass before the buffer sprint.

---

#### Buffer — Weeks 13–14 · QA and ship

| Task | Notes |
|------|-------|
| Bug fix sprint (no new features) | Fix only; feature freeze from W12 |
| Full QA pass against QR-01 to QR-07 | All quality requirements must pass |
| Privacy policy written and linked | Required for app store submission |
| GitHub Pages production deploy | Custom domain if available |
| v1.0 release notes written | Changelog, kiren-labs announcement |

**Gate M4 (end W14):** All quality requirements QR-01 through QR-07 pass. Privacy policy live. Production URL accessible. v1.0 shipped and announced.

---

### 14.4 Phase 2 — Depth (v1.1) · Weeks 15–18 · 2 sprints

Goal: make the app stickier using real feedback from v1.0 users. Scope may shift based on what users actually ask for.

#### Sprint 7 — Weeks 15–16 · Engagement layer

| Task | Notes |
|------|-------|
| Sibling fairness view | Age-normalised score display |
| Streak tracking | Consecutive days with entry or points event |
| Badge system | 5 milestone badges: first entry, 50pts, 100pts, 250pts, 7-day streak |
| Mood trend chart | Canvas, rolling 30 days, mood tag distribution |

---

#### Sprint 8 — Weeks 17–18 · Sync and notifications

| Task | Notes |
|------|-------|
| QR-based JSON sync | Co-parent imports/exports via QR code — no server |
| Push notification opt-in | "You haven't logged today" — daily reminder |
| Import validation | Schema check before writing imported data |

**Gate check (end W18):** QR sync tested end-to-end between two physical devices on different browsers. Push notification fires correctly on Android and iOS.

**Gate M5 (end W18):** v1.1 shipped. Co-parent sync working. User feedback collected from v1.0 cohort and documented for v2.0 scoping.

---

### 14.5 Phase 3 — Hardening + v2.0 Planning · Weeks 19–20

Goal: production hardening, accessibility audit, app store submission, and v2.0 scope definition.

#### Sprints 9–10 — Weeks 19–20

| Task | Notes |
|------|-------|
| Performance profiling — 2-year data volume | 730 log entries + 2000 points events stress test |
| Accessibility audit — WCAG 2.1 AA | Screen reader, contrast, touch target size |
| App store asset preparation | Screenshots, store description, icon variants |
| Google Play PWA track submission | TWA wrapper if needed |
| Apple App Store submission | WKWebView wrapper; review can take 1–2 weeks |
| v2.0 scope definition | Mini-games, cloud sync, PDF year-in-review, child display mode |

**Gate (end W20):** App store listings submitted. v2.0 PRD section drafted and prioritised.

---

### 14.6 Milestone Gate Summary

| Gate | When | Condition | Blocks |
|------|------|-----------|--------|
| M1 — Storage green | End W2 | `db.js` reads, writes, survives reload; both storage layers tested | All subsequent sprints |
| M2 — Core loop complete | End W10 | Child → log entry → points → history works end to end | Psychology + PWA sprints |
| M3 — Offline confirmed | End W12 | Full offline in Chrome DevTools AND iOS Safari | Buffer sprint |
| M4 — v1.0 ship | End W14 | QR-01 to QR-07 pass; privacy policy live; deployed | v1.1 sprints |
| M5 — v1.1 ship | End W18 | QR sync tested on two devices; push notification working | v2.0 planning |

---

### 14.7 v2.0 Feature Backlog (post week 20)

Scope to be confirmed after v1.1 user feedback.

- [ ] One offline mini-game per age group (memory card, emotion sort, drawing prompt)
- [ ] Optional cloud sync (parent-controlled, E2E encrypted — requires backend decision)
- [ ] Printable year-in-review PDF (`canvas` → blob → download)
- [ ] Child-facing display mode (read-only, shown to child by parent)
- [ ] Negative behaviour tracking with psychological guardrails (see OQ-02)
- [ ] Localisation — language support beyond English (see OQ-08)

---

## 15. Open Questions

| ID | Question | Suggested owner | Priority |
|----|----------|-----------------|----------|
| OQ-01 | What is the target minimum age of the child? Does the app support babies and toddlers (0–2)? | Product decision | High |
| OQ-02 | ~~Should negative behaviour be trackable in any form in v1?~~ **Resolved:** No negative scoring. Parent self-reflection layer (Section 10) is the designated channel for processing difficult parenting moments. | Resolved | — |
| OQ-03 | Who reviews the psychology engine suggestions for accuracy and safety? | [OPEN: Identify reviewer] | High |
| OQ-04 | What languages does v1 support? Is localisation in scope? | Product decision | Medium |
| OQ-05 | What is the monetisation model? Free with no paywall? One-time purchase? | Business decision | Medium |
| OQ-06 | Should the app be submitted to the Apple App Store and Google Play, or distributed as a web URL only? | Product + legal | Medium |
| OQ-07 | What is the plan for the suggestion content pool (30+ entries per age group)? | Content work item | High |
| OQ-08 | Does v1 need multi-language support or only English? | Product decision | Low |
| OQ-09 | Who writes the guided reflection prompts? Should they be reviewed by a parenting therapist or counsellor before shipping? | Content + psychology review | High |

---

## 16. Glossary

| Term | Definition |
|------|-----------|
| PWA | Progressive Web App — a web app that can be installed on a device home screen and works offline via service worker |
| Log entry | A parent's free-text note about what happened with a specific child on a specific day |
| Parent reflection entry | A parent's private free-text note about their own behaviour, emotional state, or parenting experience on a given day — stored separately from child log entries |
| Points event | A discrete award of points to a child for a named good deed |
| Mood tag | A single-word emotional label applied to a log entry (great, good, neutral, tired, proud) |
| Parent mood tag | A descriptive (not evaluative) label applied to a parent reflection entry (patient, present, reactive, distracted, tired) |
| My Journey | The parent-only section of the History screen showing only parent reflection entries |
| Sibling flag | A boolean on a child profile indicating whether that child has siblings in the same family profile |
| Age-normalised score | A child's points total expressed relative to the typical range for their age group, rather than as a raw number |
| Psychology engine | The module that selects age-appropriate activity suggestions based on a child's age and sibling status |
| Reflective functioning | A psychological concept (Fonagy, 1991) describing a parent's capacity to think about their own mental states and how those affect their child. The theoretical foundation for the parent self-reflection layer. |
| Constructive self-reflection | Self-reflection oriented toward learning and forward action ("what would I do differently?") as opposed to ruminative self-reflection ("why am I so bad at this?"). KidChronicle's guided prompts are designed to encourage constructive reflection only. |
| Over-justification effect | A documented psychological phenomenon where external rewards (like points) can reduce a child's intrinsic motivation for an activity they previously enjoyed |
| Service worker | A browser background script that caches app assets and enables offline use |
| IndexedDB | A browser-native key-value database that supports larger datasets and indexed queries, used here for log entries, points events, and parent reflection entries |

---

*This document is a living spec. Update it as decisions are made and open questions are resolved.*