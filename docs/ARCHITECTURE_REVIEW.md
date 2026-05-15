# KidChronicle — Architecture Review & Improvement Roadmap

> **Document type:** Senior architect assessment  
> **Date:** May 2026  
> **Branch reviewed:** `feature/logbook-entry-ui`  
> **Status:** Open for discussion

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [What is working well](#2-what-is-working-well)
3. [Weaknesses and risks](#3-weaknesses-and-risks)
4. [Five prioritized next steps](#4-five-prioritized-next-steps)
5. [Priority summary table](#5-priority-summary-table)
6. [Open questions for discussion](#6-open-questions-for-discussion)

---

## 1. Executive summary

KidChronicle has a well-designed module architecture with clear boundaries, explicit ADRs, and consistent code discipline across all JS files. The structural decisions — immutable event log for points, runtime-only age computation, structural isolation of `parentReflections` — are the right calls and are enforced consistently.

The primary challenge is not the architecture itself. It is the gap between what is **built** and what is **reachable**. Core features like export, import, entry editing, and point category management are fully implemented in JS but have no entry point in the UI. From a user's perspective, the app is incomplete.

The five steps below address: completing the UI surface for v1.0, filling the psychology engine's content gap, fixing three performance patterns that will degrade at scale, hardening PWA data durability, and setting up the codebase for v1.1 maintainability.

---

## 2. What is working well

### 2.1 Module boundary design

The IIFE-per-file pattern with a fixed, documented load order is the right choice for a zero-build-step PWA. The constraint that only `storage.js` may call IndexedDB directly is enforced consistently across all seven domain modules. No module calls `indexedDB.open()` directly. This is the most common violation in vanilla-JS apps and it does not appear here.

### 2.2 Immutable event log (points)

Points are stored as discrete `pointsEvents` records and totals are computed at read time by summing them. Running totals are never stored as mutable fields on child profiles. This eliminates an entire class of stale-state bugs and makes the points history trivially auditable. The approach aligns with event sourcing principles without the overhead of a full ES framework.

### 2.3 Structural privacy for parent reflections

`parentReflections` is a separate IndexedDB store with no `childId` field. `reflection.js` imports from `storage.js` only — it has no code path to `logbook.js`. This is a structural guarantee, not a UI convention. Child-facing screens cannot accidentally expose parent reflections because the data schema makes a join impossible. The rationale in ADR-006 is sound.

### 2.4 Error handling discipline

Every async function returns a structured `{ success, error }` object. Every `catch` block either surfaces a user-facing toast or writes to the `kc_error_log` ring buffer (capped at 10 entries). No errors are silently swallowed. This is professional-grade discipline for a client-side-only app with no crash reporting infrastructure.

### 2.5 XSS hygiene

All user-supplied strings pass through `_esc()` before `innerHTML` injection in `app.js`. This is the most common vulnerability in vanilla-JS applications and it is handled correctly and consistently throughout.

### 2.6 Canvas chart architecture

Charts are pure renderers: they read from the domain modules, write only to the canvas element, and have no side effects or storage writes. The retina display fix (`devicePixelRatio` scaling) is in place. The aggregation to weekly totals before rendering prevents the performance cliff described in R-06.

---

## 3. Weaknesses and risks

Issues are ordered by impact. Each includes the specific location in the code where the problem exists.

---

### 3.1 Critical — Implemented features are unreachable from the UI

**Severity:** P0 — v1.0 blocker

The following functions are fully implemented and tested but have no UI entry point:

| Feature | Module | Function | Missing UI |
|---|---|---|---|
| Export data | `export.js` | `exportAll()` | No trigger anywhere in the app |
| Import data | `export.js` | `importAll()` | No file picker in the app |
| Edit a log entry | `logbook.js` | `editEntry()` | History cards are read-only |
| Delete a log entry | `logbook.js` | `deleteEntry()` | History cards are read-only |
| Edit a reflection | `reflection.js` | `editReflection()` | History "My journey" cards are read-only |
| Delete a reflection | `reflection.js` | `deleteReflection()` | No delete action available |
| Point category customization | `profiles.js` | `saveSettings()` | Settings screen does not exist |

From a user's perspective, the app is currently a write-only system with no way to correct mistakes and no way to back up data. Export is the primary data portability guarantee promised in the README and privacy model — it must be accessible before v1.0 ships.

---

### 3.2 High — Three N+1 performance patterns

**Severity:** P1 — degrades with usage, hard to hotfix post-ship

**Pattern A — Full table scan on the home screen**

`logbook.getRecentEntries()` (`logbook.js:88`) calls `storage.getAll('logEntries')`, loading every entry ever written across all children into memory, then sorts and slices to 3 items. After 2 years of daily logging this is 730+ records loaded to display 3 lines.

**Pattern B — Load-and-count for entry count**

`logbook.getEntryCount()` (`logbook.js:121`) loads all entries for a child and returns `.length`. This is called on every profile render. `IDBObjectStore.count()` is the correct native API and avoids loading any data.

**Pattern C — Redundant reads per child on home screen**

`renderHome()` (`app.js:340`) calls `getTotalPoints` + `getStreakCount` per child in parallel. `getStreakCount` itself makes two separate IndexedDB reads (`logEntries` + `pointsEvents`). With 5 children, this is 15 IndexedDB reads on every home screen render. `getStreakCount` loads the same `pointsEvents` array that `getTotalPoints` already loaded one line earlier.

---

### 3.3 High — `suggestions.json` is content-starved

**Severity:** P0 — v1.0 blocker for the psychology engine

The file currently contains 16 suggestions across all age bands (2–3 per band). The CHANGELOG notes "30+ per age band due Day 16." With the 4-week recency exclusion active, a user with a school-age child (7–11) will exhaust 4 unique suggestions and see repeats within the first month. The engine degrades gracefully to fallback suggestions but the differentiated value of the psychology feature disappears.

---

### 3.4 High — `navigator.storage.persist()` is never requested

**Severity:** P1 — data loss risk on iOS

Risk R-01 in ARCHITECTURE.md is real and unmitigated. iOS Safari evicts IndexedDB storage without warning under storage pressure. The fix is a single line in `app.js init()`:

```js
if (navigator.storage?.persist) await navigator.storage.persist();
```

This requests "persistent" storage classification from the browser, which significantly reduces the eviction probability on both iOS Safari and Chrome Android. It is silently ignored where unsupported. There is no user-visible side effect and no reason not to call it.

---

### 3.5 Medium — `deleteChild` cascade is O(n) sequential transactions

**Location:** `profiles.js:84–90`

```js
for (const e of allEntries) await storage.remove(storage.STORES.LOG_ENTRIES, e.id);
for (const p of allPoints)  await storage.remove(storage.STORES.POINTS_EVENTS, p.id);
```

This opens one IndexedDB transaction per record. Deleting a child with 2 years of entries (730 log entries + 500 points events) runs 1230 sequential transactions. The correct approach is a cursor-based range delete or `clearStore` scoped to the child's records. This is not a regression risk in v1.0 with fresh data, but will surface as a perceptible pause in v1.1+ when families have history.

---

### 3.6 Low — `_wireColourPicker` uses a `setTimeout` to work around early invocation

**Location:** `app.js:313–324`

```js
function _wireColourPicker(onChange) {
  setTimeout(() => {                          // ← smell
    document.querySelectorAll('.colour-swatch').forEach(swatch => {
      swatch.addEventListener('click', ...);
    });
  }, 50);
}
```

`innerHTML` assignment is synchronous — the DOM is fully available on the very next line. The 50ms delay exists because `_wireColourPicker` is called *before* the HTML string is written to the container, not because there is any genuine async gap. On a slow device under memory pressure, 50ms may not be enough and the colour swatches silently get no event listeners — the picker appears to work but the selection never fires.

The fix is call-site discipline, not a larger timeout:

```js
// renderChildForm and renderOnboardStep:
formEl.innerHTML = `...${_renderChildFormFields(child)}...`; // write DOM first
_wireColourPicker(colour => { selectedColour = colour; });   // wire after
```

With this ordering the `setTimeout` wrapper is removed entirely. This also makes the function's contract explicit — it expects the swatches to already exist when called.

---

### 3.7 Medium — CDN URLs in the service worker install-time cache

**Location:** `service-worker.js:23–24`

```js
'https://fonts.googleapis.com/css2?...',
'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/...',
```

`cache.addAll(ASSETS)` is atomic — if any single URL fails, the entire install fails. A CDN blip during the service worker's first install means the app never goes offline. External URLs should be cached opportunistically at fetch time, not required during install.

---

### 3.8 Medium — Keyboard accessibility gap on custom interactive elements

**Severity:** P1 — QR-08 will not pass

Child cards, colour swatches, deed chips, and filter chips all carry `role="button"` and `tabindex="0"` but respond only to click events. There is no `keydown` handler for Enter or Space. Keyboard-only users and screen reader users cannot activate these elements, which violates WCAG 2.1 SC 2.1.1 and the accessibility requirements in CODING_STANDARDS.md §5.

---

### 3.9 Medium — Design token duplication between charts.js and CSS

**Location:** `charts.js:12–35`

Chart colours are hardcoded as hex strings that duplicate the CSS custom properties defined in `css/themes.css`. When the design changes, the canvas charts will drift silently from the rest of the UI because there is no shared token source accessible to both CSS and Canvas 2D context.

---

### 3.10 Low — Import has no deduplication guard

**Location:** `export.js:103–120`

`importAll` strips IDs and re-adds every record unconditionally. If a user exports and then re-imports on the same device — a common workflow when upgrading phones — every log entry, points event, and reflection doubles. There is no fingerprinting or upsert logic.

---

### 3.11 Low — `app.js` is 925 lines and will grow

`app.js` currently handles: router, onboarding (3 steps), child add/edit form, home screen, profile screen, log entry screen (two modes), history screen with filters, shared card builders, toast manager, and confirm dialog. The current architecture prohibits splitting this into separate files without updating the load order. v1.1 will add mood charts, sibling fairness view, and QR sync — all of which will land in `app.js`, pushing it past 1200+ lines. This is manageable now but will become a maintainability problem during v1.1 development.

---

## 4. Five prioritized next steps

---

### Step 1 — Complete the missing UI surfaces

**Priority:** P0 — must ship before v1.0  
**Estimated effort:** 2–3 days  
**Branches:** `feature/settings-screen`, `feature/entry-edit-delete`

#### What to build

**Settings screen (`screen-settings`)**

Add a new screen to `index.html` and a `renderSettings()` function in `app.js`. Wire it to a Settings tab in the bottom nav (replacing or augmenting the current 4-tab layout). Minimum content:

- Export data button → calls `exportData.exportAll()`, shows success/error toast
- Import data file picker → calls `exportData.importAll(file)`, shows summary of what was imported
- Point categories editor → list of current categories from `profiles.getSettings().pointCategories`, with edit and delete per row, and an Add category form

**Edit and delete on history cards**

Add a tap interaction to each entry card in `renderHistory()` that reveals an action sheet or bottom sheet with:
- Edit → opens a pre-filled version of the log entry form, submits to `logbook.editEntry(id, updates)`
- Delete → calls `showConfirm()` (already built), then `logbook.deleteEntry(id)` and refreshes the list

Apply the same pattern to reflection cards using `reflection.editReflection` / `reflection.deleteReflection`.

#### Expected outcome

Every implemented feature becomes user-accessible. Data export — the core privacy guarantee in the README — is reachable without reading source code. Parents can correct mistakes in their logs.

#### Notes

- Use `showConfirm()` for all destructive actions (already implemented in `app.js:827`)
- Wire export errors explicitly: `QuotaExceededError` and schema validation failures each have defined user-facing messages in CODING_STANDARDS.md §9
- Keep the Settings render function consistent with existing `render*` patterns

---

### Step 2 — Fill suggestions.json to content depth

**Priority:** P0 — must ship before v1.0  
**Estimated effort:** 1–2 days  
**Branch:** `content/suggestions-all-bands`

#### What to build

Expand `assets/data/suggestions.json` to reach a minimum of 30 entries per age band:

| Age band | Current | Target | Gap |
|---|---|---|---|
| Toddler (2–3) | 3 | 30 | 27 |
| Pre-school (4–6) | 4 | 30 | 26 |
| School age (7–11) | 4 | 30 | 26 |
| Early teen (12–14) | 3 | 30 | 27 |
| Teen (15+) | 2 | 20 | 18 |

Each entry must follow the schema in `CONTRIBUTING.md §9`:

```json
{
  "id": "sug_xxx",
  "ageMin": 7,
  "ageMax": 11,
  "siblingRequired": false,
  "category": "creativity",
  "title": "Short activity name",
  "description": "2–3 sentence description with what to do and why it matters.",
  "eriksonTheme": "industry",
  "piagetConcept": "concrete operations"
}
```

#### Expected outcome

With 30 entries per band and a 4-week recency window excluding previously shown suggestions, the psychology engine delivers fresh suggestions for 10+ weeks before any repeats. The feature's weekly cadence — its primary engagement hook — holds for an entire parenting cycle.

#### Notes

- `siblingRequired: true` entries should be approximately 20–25% of each band (sibling-specific activities are valuable but must not crowd out single-child content)
- Age ranges must be conservative — if an activity could work at 6 or 7, set `ageMin: 7`
- Review each entry against the constraints in `CONTRIBUTING.md §9` before committing

---

### Step 3 — Fix the three N+1 performance patterns

**Priority:** P1 — before v1.0 tag  
**Estimated effort:** 0.5 days  
**Branch:** `perf/idb-query-optimisation`

#### What to change

**Fix A — `getRecentEntries` full table scan (`logbook.js:88`)**

Maintain a `kc_recent` ring buffer in localStorage, written on every `addEntry` call. The home screen reads this instead of scanning IndexedDB.

```js
// In logbook.addEntry, after storage.add() succeeds:
const recent = storage.getLocal('kc_recent') || [];
recent.unshift({ id, childId, text: text.slice(0, 80), moodTag, date, createdAt });
storage.saveLocal('kc_recent', recent.slice(0, 10));

// getRecentEntries becomes:
async function getRecentEntries(limit = 3) {
  return (storage.getLocal('kc_recent') || []).slice(0, limit);
}
```

This trades a full IDB scan for a single synchronous localStorage read on every home screen render.

**Fix B — `getEntryCount` load-and-count (`logbook.js:121`)**

Add a `count(storeName, indexName, value)` method to `storage.js` using the native `IDBIndex.count()` API:

```js
async function count(storeName, indexName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(storeName, 'readonly');
    const index = tx.objectStore(storeName).index(indexName);
    const req   = index.count(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}
```

`logbook.getEntryCount` becomes `storage.count('logEntries', 'childId', childId)`.

**Fix C — Redundant `pointsEvents` reads per child (`points.js:136`)**

Add a `getChildSummary(childId)` function that loads `pointsEvents` once and returns both total and streak-relevant data from the same array, eliminating the duplicate read:

```js
async function getChildSummary(childId) {
  const [events, entries] = await Promise.all([
    storage.getByIndex(STORES.POINTS_EVENTS, 'childId', childId),
    storage.getByIndex(STORES.LOG_ENTRIES,   'childId', childId),
  ]);
  return {
    totalPoints: events.reduce((s, e) => s + e.points, 0),
    streak:      _computeStreak(events, entries),
  };
}
```

`renderHome` calls `getChildSummary` once per child instead of `getTotalPoints` + `getStreakCount` separately.

#### Expected outcome

Home screen load time stays under 500ms (QR-01) with 2+ years of data. Measurable with Chrome DevTools Performance panel before and after. The `getRecentEntries` fix alone eliminates the most disruptive scan.

---

### Step 4 — PWA hardening

**Priority:** P1 — before v1.0 tag  
**Estimated effort:** 0.5 days  
**Branch:** `fix/pwa-hardening`

#### Four changes

**4a — Request persistent storage on first launch**

In `app.js init()`, after `storage.openDB()`:

```js
if (navigator.storage?.persist) {
  await navigator.storage.persist(); // no-op if denied or unsupported
}
```

This is the primary mitigation for R-01 (iOS Safari IndexedDB eviction). It costs nothing and has no user-visible side effect.

**4b — Move CDN URLs out of the install-time cache**

Remove the Google Fonts and Tabler Icons CDN entries from the `ASSETS` array in `service-worker.js`. Add a separate fetch handler that caches them opportunistically on first load:

```js
// In service-worker.js fetch handler:
// For CDN requests: try cache first, fall back to network and cache the response
if (event.request.url.startsWith('https://')) {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return res;
      }))
  );
  return;
}
```

This prevents a CDN failure during install from permanently blocking offline mode.

**4c — Add a deduplication fingerprint to import**

Before inserting each record in `importAll`, check for an existing match using a composite key of `(childId + date + text.slice(0, 20))` for log entries and `(date + text.slice(0, 20))` for reflections. Skip the insert if a match exists. This guards against the common case of re-importing the same export file.

**4d — Add cache version bump to the release checklist**

Document in `CONTRIBUTING.md §6` (Definition of Done) that incrementing `CACHE_NAME` in `service-worker.js` is a required step before tagging any release. The current version (`kidchronicle-v1`) will need to become `kidchronicle-v2` when v1.1 ships, or users on the cached v1.0 will not receive updates.

#### Expected outcome

R-01 risk materially reduced. QR-07 (import/export round-trip) handles re-imports safely. Service worker installs reliably regardless of CDN availability.

---

### Step 5 — Keyboard accessibility and `app.js` decomposition

**Priority:** P2 — before v1.1 development begins  
**Estimated effort:** 1–2 days  
**Branches:** `fix/a11y-keyboard-nav`, `refactor/app-ui-split`

#### Part A — Keyboard accessibility (required for QR-08)

Add a shared utility in `app.js` that makes any `role="button"` element keyboard-activatable:

```js
function _makeKeyboardActivatable(el, handler) {
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  });
}
```

Apply to: child cards in `renderHome`, colour swatches in `_wireColourPicker`, deed chips in `_renderDeedChips`, mood chips in `_renderMoodChips`, and filter chips in `renderHistory`. Use event delegation where elements are rendered as HTML strings — attach the `keydown` listener to the parent container, same as the existing click delegation pattern.

#### Part B — `app.js` screen decomposition (v1.1 prerequisite)

Without changing the load order constraint, extract render functions into a `js/ui/` subdirectory. Each file is a new IIFE loaded before `app.js`:

```
js/
  app.js              ← router, init, shared utilities (~150 lines)
  ui/
    onboarding.js     ← showOnboarding(), renderOnboardStep()
    home.js           ← renderHome()
    profile.js        ← renderProfile()
    log-entry.js      ← renderLogEntry(), _saveEntry(), _switchLogMode()
    history.js        ← renderHistory(), _renderHistoryList()
    settings.js       ← renderSettings() (new from Step 1)
```

Each `ui/*.js` exposes its render function as a global variable (consistent with the existing IIFE module pattern). Add the new files to the `<script>` load order in `index.html` and to the `ASSETS` array in `service-worker.js`.

#### Expected outcome

QR-08 (screen reader / keyboard navigation) passes. `app.js` shrinks from 925 lines to ~150 lines of router and shared utilities. Each screen has its own file — a clear contribution surface for v1.1 features (mood charts, sibling fairness, QR sync) that does not require touching the router.

---

## 5. Priority summary table

| # | Step | Effort | Priority | Blocks |
|---|---|---|---|---|
| 1 | Settings screen + edit/delete history | 2–3 days | P0 | v1.0 ship · data portability |
| 2 | Fill suggestions.json (30+ per band) | 1–2 days | P0 | v1.0 ship · psychology engine value |
| 3 | Fix N+1 performance patterns | 0.5 days | P1 | QR-01 at scale |
| 4 | PWA hardening (persist, CDN, dedup) | 0.5 days | P1 | R-01 · QR-07 · offline reliability |
| 5 | Keyboard accessibility + app.js split | 1–2 days | P2 | QR-08 · v1.1 maintainability |

**Total estimated effort: 5–8 days**

P0 items (Steps 1 and 2) block the v1.0 release tag. P1 items (Steps 3 and 4) should be resolved before the tag because they address issues that worsen over time and are difficult to hotfix on a static PWA. P2 (Step 5) is the right setup work to do in the window between v1.0 ship and v1.1 development start.

---

## 6. Open questions for discussion

The following are unresolved decisions that should be agreed before v1.1 design begins.

**Q1 — Settings screen navigation**  
The current bottom nav has 4 tabs: Home, Log, Profile, History. A Settings screen needs a 5th entry point, or one of the existing tabs changes meaning. Options: (a) replace the Profile tab with Settings and access child profiles via Home card taps only — already the primary path; (b) add a gear icon to the Home screen header; (c) add a 5th tab and accept the nav exceeding the 4-tab cap in ARCHITECTURE.md §2. Which constraint do we relax?

**Q2 — Import conflict resolution strategy for v1.1 co-parent sync**  
The current import is merge-only (add all, no overwrite). For co-parent sync in v1.1, two parents may independently log entries for the same child on the same day. Do we: (a) accept duplicates and let the parent manually review; (b) surface a conflict screen showing both versions; (c) use `createdAt` timestamp to keep the earlier record as canonical? This decision should drive the deduplication fingerprint design in Step 4c.

**Q3 — Offline-first for v1.1 push notifications**  
v1.1 plans include push notification reminders. Push notifications require a push server, which contradicts ADR-001 (no server). The project plan notes "browser Push API with no custom server." The Web Push API requires VAPID keys, which need a server endpoint to receive and forward push messages. This is either a real server dependency or the feature needs to be scoped to local scheduled notifications (`Notification API` + `setTimeout`/`ServiceWorkerRegistration.showNotification`) only. What is the intended scope?

**Q4 — v2.0 cloud sync encryption model**  
The v2.0 roadmap includes "optional cloud sync (E2E encrypted, opt-in)." E2E encryption in a client-side app with no server requires a key derivation strategy — typically a user-supplied passphrase or a device-generated key that the user exports. This decision constrains the data model (which fields are encrypted, whether IDs are exposed), the export format (whether v1.0 exports can be imported into a v2.0 encrypted sync), and the UI (passphrase entry flow). It does not need to be decided for v1.0 but the export format established in v1.0 will need to remain importable in v2.0.

**Q5 — Content review process for suggestions.json**  
CONTRIBUTING.md §9 requires each suggestion to be "based on an established child development framework" and contributors to confirm age-appropriateness. With 130+ new entries to write before v1.0, is there a review process (second pair of eyes, consultation with a child development reference) or is the author self-certifying? This affects both the content quality and the trust model parents place in the feature.

---

*KidChronicle · ARCHITECTURE_REVIEW.md · May 2026 · kiren-labs*  
*This document is a working review — add comments, decisions, and updates inline as discussion progresses.*
