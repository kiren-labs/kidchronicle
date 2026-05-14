# Changelog — KidChronicle

All notable changes to KidChronicle are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- Complete project scaffold: all JS modules, CSS, HTML shell
- `storage.js` — IndexedDB + localStorage abstraction layer (Gate M1)
- `profiles.js` — family and child profile management with runtime age calculation
- `logbook.js` — child log entry CRUD (logEntries store)
- `reflection.js` — parent self-reflection CRUD (parentReflections store, isolated)
- `points.js` — points awards, totals, streaks, badges
- `psychology.js` — age-appropriate suggestion engine (Piaget + Erikson frameworks)
- `charts.js` — canvas bar chart rendering (no library)
- `export.js` — JSON export and import with schema validation
- `app.js` — router, onboarding, screen rendering
- `index.html` — PWA shell with 5 screens and bottom navigation
- `service-worker.js` — offline cache-first strategy
- `manifest.json` — PWA install metadata
- `assets/data/suggestions.json` — 16 placeholder suggestions (full 30+ per age band due Day 16)
- Full documentation suite: ARCHITECTURE.md, PROJECT_PLAN.md, UX_WIREFRAMES.md,
  CONTRIBUTING.md, CODING_STANDARDS.md, SECURITY.md

---

## [1.0.0] — Target: Day 14

### Planned
- Core loop: profiles → log entry → points → history → child profile chart
- Psychology engine with full suggestion content (30+ per age band)
- Offline support (service worker, cache-first)
- Parent self-reflection layer (toggle on log entry screen)
- JSON export and import
- Privacy policy

---

## [1.1.0] — Target: Day 20

### Planned
- Sibling fairness view (age-normalised scores)
- Streak tracking and badge system
- Mood trend charts (child + parent)
- QR-based co-parent sync
- Push notification opt-in reminder

