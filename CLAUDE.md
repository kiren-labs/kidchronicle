# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running locally

No build step, no npm, no Node required.

```bash
python3 -m http.server 8080
# or
npx serve .
# then open http://localhost:8080
```

Open DevTools → Application → IndexedDB to inspect data writes. There are no automated tests — all testing is manual (Chrome desktop + iOS Safari).

## Architecture

KidChronicle is a zero-dependency PWA: plain HTML, CSS, and vanilla JS. Everything runs in the browser; no server, no backend, no build pipeline.

### Storage split

| Data | Store | Why |
|---|---|---|
| Family profile, child profiles, settings | `localStorage` (`kc_*` keys) | Small, synchronous, read on every startup |
| Log entries, points events, parent reflections | IndexedDB (3 object stores) | Unbounded growth, indexed queries |

`storage.js` is the **only** module that may call IndexedDB or `localStorage` directly. All other modules go through `storage.add()`, `storage.getByIndex()`, etc.

### Module loading order (fixed — do not change)

```
storage.js → profiles.js → logbook.js → reflection.js →
points.js → psychology.js → charts.js → export.js →
ui-utils.js → ui-dialogs.js → app.js
```

Modules are loaded as IIFEs via `<script>` tags in `index.html`. There are no ES module `import`/`export` statements. A module may only depend on modules loaded before it. `app.js` depends on all others; nothing depends on `app.js`.

- `ui-utils.js` — exposes `_esc`, `_formatDate`, `showToast` as window globals
- `ui-dialogs.js` — exposes `showActionSheet`, `showConfirm` as window globals; depends on `ui-utils.js` (`_esc`)

### Hard architectural invariants

- **`reflection.js` never imports from `logbook.js`** — the `parentReflections` IndexedDB store has no `childId` field, making it impossible to accidentally join parent data to child-facing screens. This is a structural privacy guarantee (ADR-006), not a UI convention.
- **Running totals are never stored** — points totals, streak counts, entry counts are always computed by querying IndexedDB at read time. Storing computed values creates stale-state bugs.
- **Age is never stored** — only `dateOfBirth` (ISO 8601) is persisted. Call `profiles.calcAge(child.dateOfBirth)` at the call site to get `{ years, months }`.
- **Only `storage.js` opens IndexedDB** — no other module calls `indexedDB.open()` directly.

### Screen routing

`app.js` manages all screen transitions by toggling the `active` CSS class on `<div id="screen-*">` elements. Call `showScreen(screenId, options)` to navigate. Screens: `home`, `logEntry`, `profile`, `history`, `childForm`, `onboarding`.

### Service worker

Cache-first strategy. The full asset list is in `service-worker.js`. When you add a new file, add it to the `ASSETS` array. When shipping a new version, increment `CACHE_NAME` — the `activate` handler deletes old caches automatically.

Update flow (do not break this):
1. New SW installs but does **not** skip waiting automatically.
2. `app.js` detects `updatefound` → `statechange === 'installed'` → calls `_showUpdateBanner()`.
3. User clicks "Update now" in the banner → `app.js` sends `postMessage({ type: 'SKIP_WAITING' })` to the waiting SW.
4. SW calls `self.skipWaiting()` → browser fires `controllerchange` → `app.js` reloads the page.
5. `setInterval` in `app.js` polls `reg.update()` every 60 seconds so updates are caught without a full reload.

### PWA install prompt

`app.js` captures `beforeinstallprompt`, suppresses the automatic browser banner, and stashes the event in `_installPromptEvent`. When that variable is non-null, `renderSettings()` shows an "Add to home screen" row. Clicking it calls `_installPromptEvent.prompt()`. The Chrome DevTools message _"beforeinstallprompt event.preventDefault() called"_ is expected and informational — not an error.

### CSS tokens

All colours, spacing, and type use CSS custom properties defined in `css/app.css`. Do not use hard-coded hex values. Child avatar colours are defined as `avatar-<colour>` modifier classes in `css/themes.css`.

## Key code patterns

**Generating IDs for localStorage objects** (IndexedDB uses `autoIncrement`):
```js
const id = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
```

**Every async function needs try/catch** — never silently swallow errors. Either show a user-facing toast or write to the error log via `storage._logError`.

**DOM updates** — build a full HTML string and set `innerHTML` once; don't `appendChild` in a loop (causes reflow per iteration). User-supplied text must go through `_esc()` (defined in `app.js`) before insertion into `innerHTML`.

**Named constants over magic numbers** — `MAX_CHILDREN`, `HISTORY_PAGE_SIZE`, `SUGGESTION_COUNT`, etc.

## Version update protocol

Every release requires updating **two places**:

```
service-worker.js  →  CACHE_NAME = 'kidchronicle-vN'   (current: v8)
js/app.js          →  version string in renderSettings() (search "v1.0.0")
```

Also update `CHANGELOG.md`.

## Commit and branch conventions

Branches: `feature/<name>`, `fix/<name>`, `content/<name>`, `docs/<name>`, `refactor/<name>`. Never push directly to `main`.

Commit format: `<type>(<scope>): <description in present tense>`  
Scopes: `db`, `profiles`, `logbook`, `reflection`, `points`, `psychology`, `charts`, `export`, `sw`, `ui`, `a11y`, `pwa`  
Example: `feat(logbook): add back-date support to entry form`

PRs use squash-and-merge. Update `CHANGELOG.md` for any user-facing change.
