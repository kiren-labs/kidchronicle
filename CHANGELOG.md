# Changelog — KidChronicle

All notable changes to KidChronicle are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [1.1.1] — 2026-05-16

### Added
- Sibling fairness view on home screen — shown when 2+ children are present
- Coloured progress bars per child using their avatar colour, normalised to the highest scorer
- Raw scores hidden by default; "Show scores" toggle reveals absolute points

### Changed
- Service worker cache bumped to `kidchronicle-v1-1-1`
- App version display updated to v1.1.1

---

## [1.1.0] — 2026-05-16

### Added
- Mood trend chart (last 30 days) on each child's profile screen — coloured bars per mood tag
- Parent mood chart (last 30 days) on the My Journey / reflections view

### Changed
- Service worker cache bumped to `kidchronicle-v1-1-0`
- App version display updated to v1.1.0

---

## [1.0.0] — 2026-05-16

### Added
- Complete project scaffold: all JS modules, CSS, HTML shell
- `storage.js` — IndexedDB + localStorage abstraction layer
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
- `assets/data/suggestions.json` — activity suggestions pool
- Privacy policy page
- Full documentation suite: ARCHITECTURE.md, PROJECT_PLAN.md, UX_WIREFRAMES.md,
  CONTRIBUTING.md, CODING_STANDARDS.md, SECURITY.md
