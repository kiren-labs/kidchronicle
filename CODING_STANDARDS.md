# CODING_STANDARDS.md — KidChronicle

Strict guidelines for every line of code in this codebase. These rules exist because this project must be maintainable by someone who has never read it before, must work without a build tool, and must protect children's data by design.

Read this before touching any JS file.

---

## Table of contents

1. [Module rules (non-negotiable)](#1-module-rules-non-negotiable)
2. [JavaScript standards](#2-javascript-standards)
3. [Storage rules](#3-storage-rules)
4. [CSS standards](#4-css-standards)
5. [HTML standards](#5-html-standards)
6. [Naming conventions](#6-naming-conventions)
7. [Forbidden patterns](#7-forbidden-patterns)
8. [Comments and documentation](#8-comments-and-documentation)
9. [Error handling](#9-error-handling)
10. [Performance rules](#10-performance-rules)

---

## 1. Module rules (non-negotiable)

These rules protect the architecture. Violating them will not be merged.

### Rule 1.1 — Module load order is fixed

Modules are loaded via `<script>` tags in `index.html` in this exact order:

```
1. storage.js        (no dependencies)
2. profiles.js       (depends on storage.js)
3. logbook.js        (depends on storage.js)
4. reflection.js     (depends on storage.js)
5. points.js         (depends on storage.js)
6. psychology.js     (depends on storage.js + suggestions.json)
7. charts.js         (depends on storage.js, logbook.js, points.js, reflection.js)
8. export.js         (depends on storage.js)
9. app.js            (depends on all of the above)
```

A module may only depend on modules loaded before it. A module may **never** depend on `app.js`.

### Rule 1.2 — reflection.js never imports from logbook.js

```javascript
// ✅ CORRECT — reflection.js
function addReflection(text, moodTag, promptUsed, date) {
  return storage.add('parentReflections', { text, moodTag, promptUsed, date });
}

// ❌ FORBIDDEN — reflection.js must never call logbook functions
function addReflection(text, moodTag) {
  logbook.addEntry(null, text, moodTag); // VIOLATION — do not merge
}
```

### Rule 1.3 — Only storage.js touches IndexedDB directly

```javascript
// ✅ CORRECT — logbook.js calls storage.js
function addEntry(childId, text, moodTag, tags, date) {
  return storage.add('logEntries', { childId, text, moodTag, tags, date });
}

// ❌ FORBIDDEN — logbook.js must not open IndexedDB directly
function addEntry(childId, text, moodTag) {
  const request = indexedDB.open('kidchronicle'); // VIOLATION — do not merge
}
```

### Rule 1.4 — Running totals are never stored

```javascript
// ✅ CORRECT — compute at read time
function getTotalPoints(childId) {
  return storage.getByIndex('pointsEvents', 'childId', childId)
    .then(events => events.reduce((sum, e) => sum + e.points, 0));
}

// ❌ FORBIDDEN — never store a computed total
function awardPoints(childId, points) {
  child.totalPoints += points; // VIOLATION — stale state
  storage.saveLocal('kc_children', children);
}
```

### Rule 1.5 — Age is never stored

```javascript
// ✅ CORRECT — store only dateOfBirth, compute age at call site
const child = { name: 'Layla', dateOfBirth: '2018-03-15', color: 'purple' };
const { years } = profiles.calcAge(child.dateOfBirth);

// ❌ FORBIDDEN — never store age as a field
const child = { name: 'Layla', age: 7, color: 'purple' }; // VIOLATION
```

---

## 2. JavaScript standards

### ES version

Write ES6+ (arrow functions, `const`/`let`, template literals, destructuring, `async`/`await`). No `var`. No `eval`. No `with`.

### `const` vs `let`

```javascript
// Use const for everything that doesn't change
const MAX_CHILDREN = 5;
const childId = entry.childId;

// Use let only when the value genuinely changes
let total = 0;
events.forEach(e => { total += e.points; });
```

### Async / await

Use `async`/`await` for all IndexedDB operations. Never use raw Promise chains for new code.

```javascript
// ✅ CORRECT
async function getEntries(childId) {
  try {
    const entries = await storage.getByIndex('logEntries', 'childId', childId);
    return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    handleError('getEntries', err);
    return [];
  }
}

// ❌ AVOID for new code
function getEntries(childId) {
  return storage.getByIndex('logEntries', 'childId', childId)
    .then(entries => entries.sort(...))
    .catch(err => handleError('getEntries', err));
}
```

### Function size

Functions should do one thing. If a function is longer than 30 lines, split it.

### No magic numbers

```javascript
// ✅ CORRECT
const MAX_CHILDREN        = 5;
const HISTORY_PAGE_SIZE   = 20;
const SUGGESTION_COUNT    = 3;
const RECENCY_WEEKS       = 4;

// ❌ FORBIDDEN
if (children.length >= 5) { ... }        // what is 5?
return suggestions.slice(0, 3);          // what is 3?
```

---

## 3. Storage rules

### localStorage keys

All keys must use the `kc_` prefix and be defined as constants in `storage.js`:

```javascript
// storage.js — define all keys here
const KEYS = {
  FAMILY:   'kc_family',
  CHILDREN: 'kc_children',
  SETTINGS: 'kc_settings',
};
```

No module outside `storage.js` writes localStorage keys directly.

### IndexedDB store names

Defined as constants in `storage.js`:

```javascript
const STORES = {
  LOG_ENTRIES:         'logEntries',
  POINTS_EVENTS:       'pointsEvents',
  PARENT_REFLECTIONS:  'parentReflections',
};
```

### Schema version

When adding a new IndexedDB store or index, increment `DB_VERSION` in `storage.js` and handle the migration in `onupgradeneeded`.

```javascript
const DB_VERSION = 2; // increment when schema changes

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;

  if (oldVersion < 1) {
    // v1 schema
    db.createObjectStore('logEntries', { autoIncrement: true, keyPath: 'id' });
    // ...
  }
  if (oldVersion < 2) {
    // v2 additions — migration safe
    db.createObjectStore('parentReflections', { autoIncrement: true, keyPath: 'id' });
  }
};
```

---

## 4. CSS standards

### CSS tokens (custom properties)

All colours, spacing, and typography values must use CSS custom properties defined in `css/app.css`. Hard-coded values are only permitted for one-off exceptions with a comment.

```css
/* ✅ CORRECT */
.child-card {
  background: var(--color-surface);
  color:      var(--color-ink);
  border:     0.5px solid var(--color-border);
}

/* ❌ FORBIDDEN */
.child-card {
  background: #F1EFE8;   /* hard-coded — break this when tokens change */
  color:      #2C2C2A;
}
```

### Mobile-first

Write styles for 375px first. Add breakpoints for larger screens where needed:

```css
/* Base: 375px mobile */
.history-entry { padding: 10px 12px; }

/* Tablet and above */
@media (min-width: 768px) {
  .history-entry { padding: 14px 20px; }
}
```

### No `!important`

`!important` is forbidden except in the `prefers-reduced-motion` media query (where it is required to override animations).

### Class naming

Use BEM-lite naming: `block__element--modifier`.

```css
.child-card { }              /* block */
.child-card__avatar { }      /* element */
.child-card--selected { }    /* modifier */
```

---

## 5. HTML standards

### Semantic elements

Use semantic HTML. Do not use `<div>` when a more specific element exists.

```html
<!-- ✅ CORRECT -->
<nav class="bottom-nav" aria-label="Main navigation">
<button class="mood-chip" aria-pressed="false">proud</button>
<main id="screen-home" role="main">

<!-- ❌ AVOID -->
<div class="bottom-nav">
<div class="mood-chip" onclick="selectMood('proud')">proud</div>
<div id="screen-home">
```

### Accessibility attributes

Every interactive element that is not a native `<button>` or `<a>` must have `role`, `tabindex`, and event handlers for both click and keyboard.

Every icon-only button must have `aria-label`:

```html
<!-- ✅ CORRECT -->
<button class="fab" aria-label="Add new log entry">
  <i class="ti ti-plus" aria-hidden="true"></i>
</button>

<!-- ❌ FORBIDDEN -->
<button class="fab">
  <i class="ti ti-plus"></i>
</button>
```

### Screen IDs

All screens in `index.html` must have consistent IDs used by `app.js` for routing:

```html
<div id="screen-home"       class="screen" hidden>
<div id="screen-log-entry"  class="screen" hidden>
<div id="screen-profile"    class="screen" hidden>
<div id="screen-history"    class="screen" hidden>
<div id="screen-onboarding" class="screen" hidden>
```

---

## 6. Naming conventions

### JavaScript

| Type | Convention | Example |
|---|---|---|
| Functions | `camelCase`, verb-first | `addEntry`, `getTotalPoints`, `renderChart` |
| Variables | `camelCase` | `childId`, `moodTag`, `weeklyTotal` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_CHILDREN`, `CACHE_NAME`, `DB_VERSION` |
| DOM elements | `camelCase` with `El` suffix | `canvasEl`, `formEl`, `listEl` |
| Boolean variables | `is`, `has`, `can` prefix | `isOnboarding`, `hasSiblings`, `canDelete` |
| Async functions | No special prefix | `getEntries` not `getEntriesAsync` |

### CSS classes

```
.screen-<name>          ← screen containers
.btn-<variant>          ← buttons
.chip-<type>            ← filter/mood/deed chips
.card-<type>            ← card components
.modal-<name>           ← modal overlays
.icon-<name>            ← icon wrappers
```

### File names

All lowercase with hyphens: `suggestions.json`, `reflection-prompts.json`, `service-worker.js`.

### ID format for data objects

```javascript
// IDs are assigned by IndexedDB autoIncrement — never generate manually
// For localStorage objects that need a stable ID, use this pattern:
const id = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
// Example: 'child_1715693042000_x4k2m'
```

---

## 7. Forbidden patterns

These patterns will not be merged.

| Pattern | Why | Alternative |
|---|---|---|
| `var` | Function-scoped, hoisted, confusing | Use `const` or `let` |
| `eval()` | Security risk | Never use |
| `document.write()` | Overwrites the DOM | Use `innerHTML` or DOM methods |
| `innerHTML` with user input | XSS risk | Use `textContent` for user-supplied text |
| Direct `indexedDB.open()` outside `storage.js` | Violates module boundary | Call `storage.add()` etc. |
| Storing computed totals (points, age, count) | Stale state | Compute at read time |
| Storing `age` as a field | Goes stale on birthdays | Store `dateOfBirth`, call `calcAge()` |
| `reflection.js` importing from `logbook.js` | Violates privacy isolation | Use separate stores |
| `!important` in CSS (except reduced-motion) | Specificity wars | Fix the selector |
| Magic numbers | Unreadable | Define as named constants |
| Silent `catch` blocks | Hides errors | Always log or show |
| `console.log` in committed code | Log noise | Remove before PR; use `console.error` for genuine errors only |
| Direct DOM manipulation in domain modules | Coupling | Domain modules return data; `app.js` updates the DOM |

---

## 8. Comments and documentation

### When to comment

Comment **why**, not **what**. The code shows what it does. Comments explain why it does it that way.

```javascript
// ✅ CORRECT — explains why
// Age is computed at runtime, never stored.
// Storing it would require updating every child record on every birthday.
function getChildWithAge(childId) {
  const child = getChild(childId);
  return { ...child, ...calcAge(child.dateOfBirth) };
}

// ❌ USELESS — describes what the code already says
// Get child and compute age
function getChildWithAge(childId) {
  const child = getChild(childId);
  return { ...child, ...calcAge(child.dateOfBirth) };
}
```

### JSDoc for public functions

Every function exported from a module (callable by `app.js` or other modules) must have a JSDoc comment:

```javascript
/**
 * Returns up to 3 age-appropriate activity suggestions for a child.
 * Excludes suggestions shown in the last 4 weeks for this child.
 *
 * @param {number} childAge     - Child's age in years (from calcAge())
 * @param {boolean} hasSiblings - Whether the child has siblings in this family
 * @param {string} childId      - Used to check recency exclusion in kc_settings
 * @returns {Promise<Array>}    - Array of suggestion objects from suggestions.json
 */
async function getSuggestions(childAge, hasSiblings, childId) { ... }
```

### ADRs for significant decisions

Any decision that future developers might question should have an ADR in `ARCHITECTURE.md`. Do not leave confusing code uncommented — either make it obvious or add an ADR.

---

## 9. Error handling

### Every async function has a try/catch

```javascript
// ✅ CORRECT
async function addEntry(childId, text, moodTag, tags, date) {
  try {
    await storage.add('logEntries', { childId, text, moodTag, tags, date,
      createdAt: new Date().toISOString() });
    return { success: true };
  } catch (err) {
    handleError('addEntry', err);
    return { success: false, error: err.message };
  }
}

// ❌ FORBIDDEN — no error handling
async function addEntry(childId, text, moodTag) {
  await storage.add('logEntries', { childId, text, moodTag });
}
```

### Error handling hierarchy

```javascript
// storage.js — low-level error handler
function handleError(context, err) {
  // 1. Write to error log (localStorage, last 10 only)
  const log = getLocal(KEYS.ERROR_LOG) || [];
  log.unshift({ context, message: err.message, time: Date.now() });
  saveLocal(KEYS.ERROR_LOG, log.slice(0, 10));

  // 2. Re-throw so callers can decide to show UI
  throw err;
}

// app.js — UI-level error handler
function showError(message) {
  // Show red toast for 3 seconds
  showToast(message, 'error');
}
```

### User-facing error messages

| Error | Message shown to parent |
|---|---|
| `QuotaExceededError` | "Could not save — your device storage may be full. Try exporting your data first." |
| `InvalidStateError` | "Something went wrong. Please reload the app." |
| Network error (import) | "Could not read the file. Check it is a valid KidChronicle export." |
| Schema validation fail | "This file doesn't look like a KidChronicle export. No data was changed." |

---

## 10. Performance rules

### IndexedDB reads — use indexes

Always use an index for filtered queries. Never load all records and filter in JavaScript.

```javascript
// ✅ CORRECT — uses childId index
const entries = await storage.getByIndex('logEntries', 'childId', childId);

// ❌ SLOW — loads everything, filters in JS
const allEntries = await storage.getAll('logEntries');
const entries = allEntries.filter(e => e.childId === childId);
```

### Canvas charts — aggregate before rendering

```javascript
// ✅ CORRECT — aggregate to weekly totals (max 104 data points for 2yr)
const weeklyTotals = aggregateToWeeks(events, weeks);
renderBarChart(canvas, weeklyTotals);

// ❌ SLOW — render one bar per event (potentially 2000+ bars)
renderBarChart(canvas, events);
```

### DOM updates — batch, don't thrash

```javascript
// ✅ CORRECT — build HTML string, set once
const html = entries.map(e => buildEntryCard(e)).join('');
listEl.innerHTML = html;

// ❌ SLOW — triggers reflow on every append
entries.forEach(e => {
  const card = buildEntryCard(e);
  listEl.appendChild(card); // reflow on every iteration
});
```

### `localStorage` — no large objects

Do not store objects larger than 100 KB in `localStorage`. If a value is growing (e.g., caching suggestion IDs), cap it:

```javascript
// Cap error log at 10 entries
saveLocal(KEYS.ERROR_LOG, log.slice(0, 10));

// Cap dismissed suggestions at 50 per child
saveLocal(KEYS.DISMISSED, dismissed.slice(-50));
```

---

*KidChronicle · CODING_STANDARDS.md · May 2026 · kiren-labs*
*These rules apply to every PR. Update this file when a new architectural rule is needed.*
