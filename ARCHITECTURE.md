# ARCHITECTURE.md — KidChronicle

> arc42-based architecture documentation · Version 1.0 · May 2026
> Plain HTML / CSS / Vanilla JavaScript PWA · No server · No framework · No build step

---

## Table of contents

1. [Introduction and goals](#1-introduction-and-goals)
2. [Architecture constraints](#2-architecture-constraints)
3. [Context and scope](#3-context-and-scope)
4. [Solution strategy](#4-solution-strategy)
5. [Building block view](#5-building-block-view)
6. [Runtime view](#6-runtime-view)
7. [Deployment view](#7-deployment-view)
8. [Cross-cutting concepts](#8-cross-cutting-concepts)
9. [Architecture decisions (ADRs)](#9-architecture-decisions)
10. [Quality requirements](#10-quality-requirements)
11. [Risks and technical debt](#11-risks-and-technical-debt)
12. [Glossary](#12-glossary)

---

## 1. Introduction and goals

### 1.1 What KidChronicle does

KidChronicle is a Progressive Web App that gives parents a private, offline-first space to:

- Log daily interactions with their children (free text, mood tag, date)
- Award points for good deeds, tracked per child with a running total
- Reflect on their own parenting in a separate, private journal layer
- Receive age-appropriate activity suggestions based on each child's age and sibling status
- Browse a full chronological history — a permanent family memory book

The app runs entirely in the browser. There is no server, no account, no network call during normal use, and no third-party dependency at runtime.

### 1.2 Quality goals

| Priority | Quality goal | Measurable scenario |
|---|---|---|
| 1 | **Offline reliability** | All features work after first load with zero network (Chrome DevTools offline + iOS Safari airplane mode) |
| 2 | **Data durability** | All data survives browser reload, tab close, and device restart. Zero data loss on normal use. |
| 3 | **Performance** | Log entry saves and UI updates in < 500ms on a mid-range Android device with 2 years of data loaded |
| 4 | **Privacy by design** | Zero bytes of user data transmitted to any external server during normal use (verified by DevTools Network audit) |
| 5 | **Usability** | First log entry achievable in < 30 seconds without reading instructions (new parent, fresh install) |

### 1.3 Stakeholders

| Role | Expectation |
|---|---|
| Parent (primary user) | Fast entry, warm UX, data never leaves device, works offline |
| Child (indirect user) | Shown their profile by parent — sees points, badges, suggestions |
| Co-parent (v1.1) | Can import/export data via QR sync on their own device |
| Developer / contributor | Clear module boundaries, no hidden dependencies, documented decisions |
| kiren-labs (maintainer) | Sustainable codebase, no framework lock-in, deployable from GitHub Pages |

---

## 2. Architecture constraints

| Type | Constraint | Reason |
|---|---|---|
| **Technical** | No server, no backend, no database | Privacy by design — avoids COPPA/GDPR-K server obligations; eliminates hosting cost |
| **Technical** | No npm, no Node, no build step | Stated requirement — runs as plain HTML/CSS/JS directly from the filesystem |
| **Technical** | No external JS libraries at runtime | Zero dependency rot; fully auditable code; works offline without CDN |
| **Technical** | Must work as an installable PWA | Offline-first; home screen install on iOS and Android via `manifest.json` + service worker |
| **Technical** | `reflection.js` never imports from `logbook.js` | Structural privacy guarantee — parent data must not be queryable from child screens |
| **Legal** | No transmission of child data off-device | COPPA (US) / GDPR-K (EU) — keeping everything local is the primary compliance mechanism |
| **Legal** | Privacy policy required before app store submission | Required by Apple App Store and Google Play even for local-only apps |
| **Design** | First log entry achievable in < 30 seconds | Habit formation — the app only works if parents log consistently |
| **Design** | Mobile-first (375px+) | Primary device is a parent's phone |
| **Design** | Maximum 4 bottom navigation tabs | Complexity cap — no hamburger menus, no buried settings |

---

## 3. Context and scope

### 3.1 System context

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Parent's device                               │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    KidChronicle PWA                         │   │
│   │                                                             │   │
│   │  Browser (Chrome / Safari / Firefox)                        │   │
│   │  ├── index.html + CSS + JS modules                          │   │
│   │  ├── Service Worker (offline asset cache)                   │   │
│   │  ├── localStorage (profiles, settings)                      │   │
│   │  └── IndexedDB (log entries, points, reflections)           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   Network: used ONCE on first load to fetch assets.                  │
│   Never used again during normal operation.                          │
└──────────────────────────────────────────────────────────────────────┘

External actors:
  Parent ──────────► KidChronicle (logs entries, awards points, reads history)
  Child  ──────────► KidChronicle (shown profile by parent — read-only)
  Co-parent (v1.1) ► KidChronicle (imports data via QR scan)

External systems:
  GitHub Pages ────► Serves static assets on first load (one-time)
  App Stores  ─────► Distribute the PWA (v2 — optional, not required for operation)
```

### 3.2 What is deliberately outside the system

| Out of scope | Reason |
|---|---|
| Any server, API, or database | Privacy by design |
| User accounts or authentication | No server means no auth |
| Bank accounts, real money, debit cards | Different product category |
| Push notification server | v1.1 uses browser Push API with no custom server |
| Analytics, crash reporting, telemetry | No data leaves the device |
| Multi-device real-time sync | v1.1 uses QR-based manual export/import |

---

## 4. Solution strategy

### 4.1 Key technology decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Runtime stack** | Plain HTML / CSS / Vanilla JS | No build step, no dependency rot, fully auditable, works offline without CDN |
| **Storage — small data** | `localStorage` | Synchronous, fast, sufficient for profiles (< 50KB) |
| **Storage — large data** | `IndexedDB` | Async, handles unbounded log history, supports indexed queries by `childId` and `date` |
| **Offline** | Service Worker with cache-first strategy | All assets cached on install; works in airplane mode after first load |
| **Deployment** | GitHub Pages (static) | Zero cost, zero ops, zero server |
| **Module isolation** | ES module pattern (IIFE/closure, no `import`/`export` yet) | No build step; each file is self-contained; loaded in order via `<script>` tags |

### 4.2 Top-level decomposition

The system is decomposed into **7 functional modules** (JS files) + **1 infrastructure layer** (storage abstraction). Each module has a single responsibility and communicates through the storage layer, never directly with other modules.

```
App router (app.js)
    │
    ├── profiles.js      ← family + child CRUD
    ├── logbook.js       ← child log entries (reads/writes logEntries store)
    ├── reflection.js    ← parent reflections (reads/writes parentReflections store)
    ├── points.js        ← points awards + totals + streaks
    ├── psychology.js    ← age-based suggestion engine (reads suggestions.json)
    ├── charts.js        ← canvas rendering (reads from storage, no writes)
    └── export.js        ← JSON serialisation of all stores
            │
            └── storage.js  ← single source of truth for all reads/writes
                    │
                    ├── localStorage     (kc_family, kc_children, kc_settings)
                    └── IndexedDB        (logEntries, pointsEvents, parentReflections)
```

### 4.3 Quality strategy

| Quality goal | Strategy |
|---|---|
| Offline reliability | Service worker with explicit cache list — every asset named. No dynamic imports. |
| Data durability | Running totals computed at read time (never stored as mutable fields). All writes in single IndexedDB transactions. |
| Performance | IndexedDB stores indexed by `childId` + `date`. Canvas charts built in-memory before rendering. Pagination (20 entries per page) on history view. |
| Privacy | `reflection.js` is structurally isolated — child-facing screens have no code path to `parentReflections`. All network calls are blocked in the service worker after first load. |
| Usability | Log entry screen designed for ≤ 5 taps from app open to saved entry. Single Save button writes both log and points in one transaction. |

---

## 5. Building block view

### 5.1 Level 1 — System overview

```
┌──────────────────────────────────────────────────────────┐
│                   KidChronicle PWA                       │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────────┐ │
│  │ Profiles │   │  Logbook │   │  Parent Reflection   │ │
│  │ Manager  │   │  Engine  │   │  Engine              │ │
│  └────┬─────┘   └────┬─────┘   └──────────┬───────────┘ │
│       │              │                     │             │
│  ┌────▼─────┐   ┌────▼─────┐   ┌──────────▼───────────┐ │
│  │  Points  │   │ History  │   │  Psychology Engine   │ │
│  │  Engine  │   │ Timeline │   │  (suggestions.json)  │ │
│  └────┬─────┘   └────┬─────┘   └──────────┬───────────┘ │
│       │              │                     │             │
│       └──────────────┼─────────────────────┘             │
│                      ▼                                   │
│             ┌────────────────┐                           │
│             │  Storage Layer │                           │
│             │  (storage.js)  │                           │
│             └───────┬────────┘                           │
│                     │                                    │
│          ┌──────────┴──────────┐                         │
│          ▼                     ▼                         │
│    localStorage           IndexedDB                      │
│  (profiles, settings)  (logEntries, pointsEvents,        │
│                          parentReflections)              │
│                                                          │
│  ┌──────────┐   ┌──────────┐                             │
│  │  Charts  │   │  Export  │                             │
│  │ (canvas) │   │  (JSON)  │                             │
│  └──────────┘   └──────────┘                             │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Level 2 — Module responsibilities

#### `storage.js` — Storage layer

| Responsibility | Detail |
|---|---|
| Open IndexedDB | `openDB()` — opens `kidchronicle` database v1, creates 3 object stores on first run |
| CRUD wrappers | `add(store, data)`, `get(store, id)`, `getAll(store)`, `getByIndex(store, index, value)`, `delete(store, id)` |
| localStorage helpers | `saveLocal(key, value)`, `getLocal(key)`, `removeLocal(key)` |
| Schema migration | `onupgradeneeded` handler — adds new stores/indexes when version increments |

**Object stores:**

| Store | Key | Indexes | Used by |
|---|---|---|---|
| `logEntries` | `id` (auto) | `childId`, `date` | `logbook.js` only |
| `pointsEvents` | `id` (auto) | `childId`, `date` | `points.js` only |
| `parentReflections` | `id` (auto) | `date` | `reflection.js` only |

**localStorage keys:**

| Key | Value | Used by |
|---|---|---|
| `kc_family` | Family profile JSON | `profiles.js` |
| `kc_children` | Array of child profiles JSON | `profiles.js` |
| `kc_settings` | App preferences JSON | `app.js` |

---

#### `profiles.js` — Family and child profiles

| Function | Signature | What it does |
|---|---|---|
| `saveFamily` | `(familyObj)` | Writes to `kc_family` in localStorage |
| `getFamily` | `()` | Reads `kc_family` from localStorage |
| `saveChildren` | `(childrenArray)` | Writes to `kc_children` in localStorage |
| `getChildren` | `()` | Reads `kc_children` and enriches each with `calcAge()` |
| `calcAge` | `(dateOfBirth)` | Returns `{ years, months }` computed at call time — age is **never stored** |
| `deleteChild` | `(childId)` | Removes child from `kc_children` + cascades delete to all 3 IndexedDB stores |

---

#### `logbook.js` — Child log entries

> Reads/writes `logEntries` store **only**. Never touches `parentReflections`.

| Function | Signature | What it does |
|---|---|---|
| `addEntry` | `(childId, text, moodTag, tags, date)` | Adds entry to `logEntries` store |
| `getEntries` | `(childId, filters)` | Returns entries filtered by child, date range, mood tag |
| `editEntry` | `(id, updates)` | Partial update — only changed fields written |
| `deleteEntry` | `(id)` | Hard delete from `logEntries` |
| `getRecentEntries` | `(limit)` | Returns most recent `n` entries across all children (Home screen) |

---

#### `reflection.js` — Parent self-reflection

> Reads/writes `parentReflections` store **only**. Never imports from `logbook.js`.

| Function | Signature | What it does |
|---|---|---|
| `addReflection` | `(text, moodTag, promptUsed, date)` | Adds entry to `parentReflections` store — no `childId` |
| `getReflections` | `(filters)` | Returns reflections filtered by date range, mood tag |
| `deleteReflection` | `(id)` | Hard delete from `parentReflections` |
| `getReflectionPrompt` | `(weekNumber)` | Returns the guided prompt for the current week from `reflection-prompts.json` |

---

#### `points.js` — Points and rewards

| Function | Signature | What it does |
|---|---|---|
| `awardPoints` | `(childId, categoryId, label, points, date)` | Writes to `pointsEvents` store |
| `getTotalPoints` | `(childId)` | Sums all `pointsEvents` for a child — computed at read time, never stored |
| `getPointsHistory` | `(childId, weeks)` | Returns weekly point totals for the last `n` weeks |
| `getStreakCount` | `(childId)` | Counts consecutive days with at least one log entry or points event |
| `getCategories` | `()` | Returns point categories from `kc_settings` (with defaults) |
| `saveCategories` | `(categories)` | Writes custom categories to `kc_settings` |

---

#### `psychology.js` — Suggestion engine

| Function | Signature | What it does |
|---|---|---|
| `getSuggestions` | `(childAge, hasSiblings, childId)` | Returns 3 suggestions filtered by age + sibling status, excluding last 4 weeks |
| `dismissSuggestion` | `(childId, suggestionId)` | Records dismissal in `kc_settings` to prevent immediate re-show |

**Selection algorithm:**
1. Load `suggestions.json` (bundled, no network call)
2. Filter: `ageMin <= childAge <= ageMax`
3. Filter: `siblingRequired` matches `hasSiblings` (non-sibling suggestions always included)
4. Exclude: suggestions shown to this child in last 4 weeks
5. Random select 3 from remaining pool
6. If pool < 3: allow repeats from exclusion list

---

#### `charts.js` — Canvas rendering

| Function | Signature | What it does |
|---|---|---|
| `renderPointsChart` | `(childId, canvasEl, weeks)` | Draws 8-week rolling bar chart on `<canvas>` — no library |
| `renderMoodChart` | `(childId, canvasEl, days)` | Draws 30-day mood distribution bars on `<canvas>` |
| `renderParentMoodChart` | `(canvasEl, days)` | Draws 30-day parent mood distribution (My Journey view) |

All chart functions are pure renderers — they read from storage via `points.js` / `logbook.js` / `reflection.js` and write only to the canvas element. No side effects.

---

#### `export.js` — Data portability

| Function | Signature | What it does |
|---|---|---|
| `exportAll` | `()` | Serialises all 3 IndexedDB stores + localStorage to a single JSON object, offers file download |
| `importAll` | `(jsonFile)` | Validates schema, prompts for confirmation, writes to all stores |
| `validateSchema` | `(jsonObj)` | Returns `{ valid: bool, errors: [] }` — checks all required keys and data types |

---

#### `app.js` — Router and initialisation

| Responsibility | Detail |
|---|---|
| First-launch detection | Checks `kc_family` in localStorage — if absent, routes to onboarding |
| Screen routing | Swaps CSS `display` on screen `<div>` elements based on nav tab or action |
| Service worker registration | Registers `service-worker.js` with update detection |
| Bottom nav state | Manages active tab highlight |
| FAB handler | Wires floating action button to Log Entry screen |

---

### 5.3 Data flow — log entry with points

```
Parent taps FAB (+)
        │
        ▼
app.js routes to Log Entry screen
        │
        ▼
Parent selects child chip → selects mood → taps deed chip → taps Save
        │
        ▼
logbook.js.addEntry(childId, text, moodTag, tags, date)
        │
        ├── storage.js.add('logEntries', entryObj)
        │           └── IndexedDB write (async)
        │
        └── (if deed chip selected)
            points.js.awardPoints(childId, categoryId, label, points, date)
                    └── storage.js.add('pointsEvents', eventObj)
                                └── IndexedDB write (async, same transaction)
        │
        ▼
Both writes committed → green toast "Entry saved" → route to Home
        │
        ▼
Home screen re-renders child card with updated total from:
    points.js.getTotalPoints(childId)
        └── storage.js.getByIndex('pointsEvents', 'childId', childId)
            └── sum all .points fields
```

---

## 6. Runtime view

### 6.1 Scenario: First launch — onboarding to first log entry

```
sequenceDiagram
    participant P as Parent
    participant App as app.js
    participant Prof as profiles.js
    participant Store as storage.js
    participant Log as logbook.js

    P->>App: Opens app URL
    App->>Store: getLocal('kc_family')
    Store-->>App: null (first launch)
    App->>App: Route to onboarding Step 1

    P->>App: Enters family name → Continue
    P->>App: Enters child name + DOB + colour → Continue
    App->>Prof: saveFamily({name: 'The Johnsons'})
    Prof->>Store: saveLocal('kc_family', familyObj)
    App->>Prof: saveChildren([{name:'Layla', dob:'2018-03-15', color:'purple'}])
    Prof->>Store: saveLocal('kc_children', childrenArray)
    App->>App: Route to Done screen → Home

    P->>App: Taps FAB (+)
    App->>App: Route to Log Entry screen

    P->>App: Types text, taps mood, taps Save
    App->>Log: addEntry(childId, text, moodTag, [], today)
    Log->>Store: add('logEntries', entryObj)
    Store-->>Log: entry saved
    App->>App: Toast "Entry saved" → Route to Home
```

### 6.2 Scenario: Offline use after first load

```
sequenceDiagram
    participant P as Parent
    participant SW as Service Worker
    participant App as Browser Cache
    participant DB as IndexedDB

    P->>SW: Opens app (offline)
    SW->>App: Serves index.html from cache
    SW->>App: Serves all JS/CSS from cache
    App-->>P: App loads normally

    P->>App: Adds log entry
    App->>DB: write to logEntries (local)
    DB-->>App: success
    App-->>P: "Entry saved" toast

    Note over SW: No network call at any point.
    Note over DB: All data local — survives offline indefinitely.
```

### 6.3 Scenario: Export and co-parent import (v1.1)

```
sequenceDiagram
    participant P1 as Parent A (phone)
    participant P2 as Parent B (phone)
    participant Exp as export.js
    participant Val as validateSchema
    participant Store as storage.js

    P1->>Exp: Taps Export → Share via QR
    Exp->>Store: getAll (all 3 stores + localStorage)
    Store-->>Exp: full data object
    Exp->>Exp: Serialise to JSON + encode as QR

    P2->>P2: Opens QR scanner in app
    P2->>Val: Scans QR → decode JSON
    Val->>Val: validateSchema(jsonObj)
    Val-->>P2: {valid: true}
    P2->>P2: Confirmation dialog "Import 18 entries?"
    P2->>Store: Write all entries (merge, no overwrite)
    Store-->>P2: success
    P2-->>P2: Toast "Data imported"
```

### 6.4 Scenario: Storage failure

```
sequenceDiagram
    participant P as Parent
    participant Log as logbook.js
    participant Store as storage.js
    participant UI as app.js

    P->>Log: Taps Save
    Log->>Store: add('logEntries', entryObj)
    Store-->>Log: QuotaExceededError (device storage full)
    Log-->>UI: {success: false, error: 'QuotaExceededError'}
    UI-->>P: Red toast "Could not save — your device storage may be full"
    Note over UI: Entry remains in form — parent can retry or export first
```

---

## 7. Deployment view

### 7.1 Production deployment

```
Developer machine
    │
    │  git push origin main
    ▼
GitHub repository
(kiren-labs/kidchronicle)
    │
    │  GitHub Pages (automatic on push to main)
    ▼
GitHub Pages CDN
https://kiren-labs.github.io/kidchronicle
    │
    │  HTTPS GET /index.html (first load only)
    ▼
Parent's browser
    │
    │  Service Worker installs, caches all assets
    ▼
Local device cache
    │
    │  All subsequent use — no network
    ▼
localStorage + IndexedDB
(all data, forever, on-device)
```

### 7.2 There is no staging environment

This is a static PWA. There are no servers, no environments, no pipelines. The "staging" equivalent is:

```bash
# Run locally before pushing
python3 -m http.server 8080
# Open http://localhost:8080 in Chrome
# Test against Gate checklist
# Push to main when gates pass
```

### 7.3 Files served from GitHub Pages

```
/index.html            ← entry point
/manifest.json         ← PWA install metadata
/service-worker.js     ← offline cache
/css/reset.css
/css/app.css
/css/themes.css
/js/app.js
/js/storage.js
/js/profiles.js
/js/logbook.js
/js/reflection.js
/js/points.js
/js/psychology.js
/js/charts.js
/js/export.js
/assets/icons/icon-192.png
/assets/icons/icon-512.png
/assets/data/suggestions.json
/assets/data/reflection-prompts.json
```

The service worker caches **every file in this list** on first install. Adding a new file requires updating the cache list in `service-worker.js`.

---

## 8. Cross-cutting concepts

### 8.1 Data persistence strategy

| Data type | Store | Why |
|---|---|---|
| Family profile, settings | `localStorage` | Small (< 10KB), synchronous read on startup |
| Child profiles | `localStorage` (`kc_children`) | Small, frequently read |
| Log entries | `IndexedDB` (`logEntries`) | Unbounded growth; needs indexed queries |
| Points events | `IndexedDB` (`pointsEvents`) | Unbounded growth; summed at read time |
| Parent reflections | `IndexedDB` (`parentReflections`) | Unbounded growth; structurally isolated |

**Running totals are never stored.** Points totals, streak counts, and entry counts are always computed by querying IndexedDB at read time. This eliminates an entire class of stale-state bugs.

### 8.2 Error handling

| Error type | Handling strategy |
|---|---|
| `QuotaExceededError` | Non-blocking red toast; entry remains in form; suggest export |
| IndexedDB unavailable (private browsing) | Detect on startup; show non-blocking warning banner; app degrades gracefully |
| Malformed JSON on import | `validateSchema()` catches before any write; user sees specific error |
| Service worker install failure | App still works online; offline capability silently unavailable |
| Unknown JS error | `window.onerror` writes to `kc_error_log` in localStorage (last 10 errors only) |

**No error is silently swallowed.** Every `catch` block either shows a user-facing message or writes to the error log.

### 8.3 Privacy and data isolation

The parent self-reflection layer has a **structural** privacy guarantee, not a UI-level one:

- `reflection.js` is a standalone module — it never imports from `logbook.js`
- Child-facing screens (`profiles.js`, child profile view) query only `logEntries` and `pointsEvents`
- The `parentReflections` store has no `childId` field — it cannot be accidentally joined to child data
- JSON export labels the two sets clearly: `childLogEntries` vs `parentReflections`

### 8.4 Offline / Service Worker strategy

Cache strategy: **cache-first for all assets**.

```javascript
// service-worker.js pattern
const CACHE_NAME = 'kidchronicle-v1';
const ASSETS = [
  '/', '/index.html', '/manifest.json',
  '/css/reset.css', '/css/app.css', '/css/themes.css',
  '/js/app.js', '/js/storage.js', /* ... all JS files */
  '/assets/data/suggestions.json',
  '/assets/data/reflection-prompts.json',
  '/assets/icons/icon-192.png', '/assets/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

**Cache invalidation:** When a new version ships, increment `CACHE_NAME` (e.g., `kidchronicle-v2`). The old cache is deleted in the `activate` event.

### 8.5 Age calculation

Age is **always computed at runtime** from `dateOfBirth`. It is never stored as a field on the child profile.

```javascript
// profiles.js
function calcAge(dateOfBirth) {
  const today = new Date();
  const dob   = new Date(dateOfBirth);
  let years   = today.getFullYear() - dob.getFullYear();
  let months  = today.getMonth()    - dob.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
    years--;
    months += 12;
  }
  return { years, months };
}
```

This guarantees the psychology engine always uses the correct current age, including on birthdays.

### 8.6 Canvas chart rendering

All charts are drawn on `<canvas>` using the 2D context API. No charting library is used.

```javascript
// charts.js pattern
function renderPointsChart(childId, canvasEl, weeks = 8) {
  const ctx    = canvasEl.getContext('2d');
  const data   = points.getPointsHistory(childId, weeks); // [{week, total}, ...]
  const max    = Math.max(...data.map(d => d.total), 1);
  const W      = canvasEl.width;
  const H      = canvasEl.height;
  const barW   = (W / data.length) * 0.6;
  const gap    = (W / data.length) * 0.4;

  ctx.clearRect(0, 0, W, H);
  data.forEach((d, i) => {
    const barH  = (d.total / max) * (H - 20);
    const x     = i * (barW + gap) + gap / 2;
    const y     = H - barH;
    ctx.fillStyle = d.total === max ? '#2C2C2A' : '#D3D1C7';
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 3);
    ctx.fill();
  });
}
```

### 8.7 Module loading order

Modules are loaded via `<script>` tags in `index.html` in dependency order:

```html
<!-- 1. Storage (no dependencies) -->
<script src="js/storage.js"></script>

<!-- 2. Domain modules (depend on storage only) -->
<script src="js/profiles.js"></script>
<script src="js/logbook.js"></script>
<script src="js/reflection.js"></script>
<script src="js/points.js"></script>
<script src="js/psychology.js"></script>
<script src="js/charts.js"></script>
<script src="js/export.js"></script>

<!-- 3. App router (depends on all domain modules) -->
<script src="js/app.js"></script>
```

No circular dependencies are permitted. `storage.js` has no dependencies. Domain modules depend only on `storage.js`. `app.js` depends on all domain modules.

---

## 9. Architecture decisions

### ADR-001 — No server, no backend

| | |
|---|---|
| **Status** | Accepted |
| **Date** | May 2026 |

**Problem:** Where should user data be stored?

**Options considered:**

| | Option A: Server + database | Option B: Client-only (chosen) |
|---|---|---|
| Privacy | Data leaves device | Data never leaves device |
| Legal | COPPA/GDPR-K server obligations | Minimal — local storage only |
| Cost | Hosting, ops, maintenance | Zero |
| Offline | Complex (sync, conflict resolution) | Native — always offline |
| Auth | Required (passwords, sessions) | Not required |
| Risk | Server breach exposes child data | No server = no breach surface |

**Decision:** All data stays on the client. `localStorage` + `IndexedDB` only.

**Consequence:** Co-parent sync requires manual QR export/import (v1.1). Real-time sync between devices is not possible without a server.

---

### ADR-002 — No npm, no build step

| | |
|---|---|
| **Status** | Accepted |
| **Date** | May 2026 |

**Problem:** How should the codebase be structured and delivered?

**Options considered:**

| | Option A: npm + bundler (Vite/Webpack) | Option B: Plain files (chosen) |
|---|---|---|
| Developer onboarding | Requires Node.js install | Clone + open in browser |
| Dependency surface | Hundreds of transitive deps | Zero |
| Build failures | Possible | Impossible — no build step |
| Offline capability | Requires bundler output | Files served directly |
| Long-term maintenance | Framework/bundler upgrades | None required |

**Decision:** Plain HTML/CSS/JS. No build step. No npm.

**Consequence:** No TypeScript, no JSX, no module bundler optimisations (tree-shaking, code splitting). JS files load in order via `<script>` tags.

---

### ADR-003 — IndexedDB for log entries, localStorage for profiles

| | |
|---|---|
| **Status** | Accepted |
| **Date** | May 2026 |

**Problem:** `localStorage` has a 5–10 MB limit and is synchronous. Log entries and points events are unbounded in volume.

**Decision:** Small, frequently-read config objects (profiles, settings) use `localStorage`. Unbounded data (log entries, points, reflections) uses `IndexedDB`.

**Consequence:** The storage layer (`storage.js`) must abstract over two different APIs. IndexedDB's async API is encapsulated entirely in `storage.js` — no other module calls IndexedDB directly.

---

### ADR-004 — Age computed at runtime, never stored

| | |
|---|---|
| **Status** | Accepted |
| **Date** | May 2026 |

**Problem:** A stored `age` field becomes stale the moment a child has a birthday.

**Decision:** Store only `dateOfBirth` (ISO 8601 string). Compute age in years and months at the call site using `calcAge()`.

**Consequence:** Any function that uses age must call `calcAge(child.dateOfBirth)`. The psychology engine always receives the correct current age.

---

### ADR-005 — Points are additive only (no deductions in v1)

| | |
|---|---|
| **Status** | Accepted |
| **Date** | May 2026 |

**Problem:** Should parents be able to deduct points for negative behaviour?

**Decision:** No deductions in v1. Points can only increase.

**Rationale:** The over-justification effect (Lepper et al., 1973) — external rewards for intrinsically motivated behaviour can reduce intrinsic motivation. Point deductions add a punishment mechanic that risks undermining the positive reinforcement model. The parent self-reflection layer is the designated channel for processing difficult parenting moments.

**Consequence:** Point total is a cumulative lifetime score, not a balance. Deductions can be added in v2 with explicit parent education about the psychological tradeoffs.

---

### ADR-006 — Parent reflections in a separate IndexedDB store

| | |
|---|---|
| **Status** | Accepted |
| **Date** | May 2026 |

**Problem:** Should parent reflection entries be stored alongside child log entries?

**Decision:** `parentReflections` is a separate IndexedDB object store. `reflection.js` never imports from `logbook.js`. Child-facing screens have no code path to `parentReflections`.

**Rationale:** This is a structural privacy guarantee, not a UI convention. If both record types shared a store, a future developer could accidentally expose parent reflections in child-facing views by querying the wrong store. Separation makes this class of error architecturally impossible.

**Consequence:** Export includes both stores under separate keys. Any feature that shows "all entries" must explicitly decide whether to include reflections. The default is: do not include.

---

## 10. Quality requirements

### 10.1 Quality scenarios

| ID | Category | Scenario | Metric |
|---|---|---|---|
| QR-01 | Performance | Parent saves a log entry on a mid-range Android phone with 2 years of data loaded | Entry saved and UI updated in < 500ms |
| QR-02 | Reliability | Browser refreshed mid-session | All previously saved data intact on reload — zero data loss |
| QR-03 | Offline | Device goes offline after first load | All features fully functional — no spinners, no error states, no degradation |
| QR-04 | Usability | Parent opens app for the first time | First log entry completed in < 30 seconds without reading instructions |
| QR-05 | Scalability | Family uses app daily for 2 years (730 log entries, 2000 points events, 200 reflections) | App remains responsive; History scrolls without jank; charts render in < 200ms |
| QR-06 | Privacy | App audited during normal use | Zero requests to external servers in DevTools Network tab |
| QR-07 | Portability | User exports JSON and imports on a new device | All data present, correctly rendered, no entries missing |
| QR-08 | Accessibility | Screen reader user navigates core flow | All interactive elements announced correctly by VoiceOver (iOS) and TalkBack (Android) |

---

## 11. Risks and technical debt

| ID | Risk / Debt | Impact | Probability | Mitigation |
|---|---|---|---|---|
| R-01 | **iOS Safari IndexedDB eviction** — iOS may clear IndexedDB under storage pressure without warning | High — data loss | Medium | Request persistent storage via `navigator.storage.persist()` on first launch; show last-export-date prominently; remind users to export |
| R-02 | **Parent habit drop-off** — parents stop logging within 2 weeks | High — app becomes useless | High | Log entry must be under 30 seconds; v1.1 push notification reminder; onboarding celebrates first entry immediately |
| R-03 | **Psychology content quality** — suggestions.json entries are inappropriate or harmful for the stated age range | High — parental trust destroyed | Low | Content review pass before v1.0 ships; conservative age ranges; "not relevant" dismiss button feeds future filtering |
| R-04 | **Service worker cache staleness** — users run old version without knowing | Medium — bugs persist after fix | Medium | Increment `CACHE_NAME` on every release; show "update available" banner when new SW detected |
| R-05 | **Co-parent sync data conflict** — two parents modify same entry independently before syncing | Medium — data inconsistency | Medium (v1.1) | v1.1 import is merge-only (no overwrite); flag conflicts for user resolution; document clearly in UI |
| R-06 | **Canvas chart performance with large datasets** — rendering 2yr chart with 730 bars | Medium — UI jank | Low | Aggregate to weekly totals before rendering (max 104 bars); test with synthetic data on Day 18 |
| R-07 | **COPPA/GDPR-K app store review** — stores may flag the app for storing children's data | High — rejection | Low | Privacy policy explains local-only storage; no account creation; no data transmission. Document for review. |
| TD-01 | **No automated tests** — all testing is manual | Medium — regressions undetected | High | Acceptable for v1; add automated integration tests using Playwright in v2 |
| TD-02 | **No TypeScript** — no static type checking | Low — runtime errors harder to catch | Medium | ESLint + JSDoc comments as partial mitigation; TypeScript migration deferred to v2 |

---

## 12. Glossary

| Term | Definition |
|---|---|
| **PWA** | Progressive Web App — a web app installable on device home screen, works offline via service worker |
| **Service Worker** | Browser background script that intercepts network requests and serves cached assets for offline use |
| **IndexedDB** | Browser-native key-value database supporting large datasets and indexed queries |
| **localStorage** | Synchronous browser key-value store; 5–10 MB limit; used here for small config data only |
| **Log entry** | A parent's free-text note about what happened with a specific child on a specific day |
| **Parent reflection** | A parent's private note about their own emotional state or behaviour on a given day — stored separately from log entries |
| **Points event** | A discrete award of points to a child for a named good deed — stored as an immutable event, never a mutable balance |
| **Running total** | Points total computed by summing all `pointsEvents` at read time — never stored as a field |
| **Age normalisation** | Expressing a child's points score as a percentile within their age group's typical range — prevents unfair sibling comparison |
| **Psychology engine** | The module that selects age-appropriate activity suggestions from `suggestions.json` based on a child's current age |
| **Reflective functioning** | A parent's capacity to think about their own mental states and how those affect their child (Fonagy, 1991) — the theoretical basis for the parent reflection layer |
| **Over-justification effect** | When external rewards reduce intrinsic motivation for an activity (Lepper et al., 1973) — the basis for ADR-005 (no point deductions) |
| **Cache-first strategy** | Service worker pattern: serve from cache if available, fall through to network only if not — maximises offline reliability |
| **kc_*** | Prefix for all KidChronicle localStorage keys (`kc_family`, `kc_children`, `kc_settings`) |

---

*KidChronicle · ARCHITECTURE.md · arc42 v1.0 · May 2026 · kiren-labs*
*Update this document when a new ADR is added, a module is significantly changed, or a quality requirement is revised.*
