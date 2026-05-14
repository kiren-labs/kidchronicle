# KidChronicle

> **Your child's story, one day at a time.**

A private, offline-first Progressive Web App for parents to log their children's days, award points for good deeds, reflect on their own parenting, and receive age-appropriate activity ideas.

**No server. No account. No cost. Works offline. Data stays on your device.**

[![GitHub Pages](https://img.shields.io/badge/Live-GitHub%20Pages-2C2C2A?style=flat)](https://kiren-labs.github.io/kidchronicle)
[![License](https://img.shields.io/badge/License-MIT-0F6E56?style=flat)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-3C3489?style=flat)](CHANGELOG.md)
[![Sister app](https://img.shields.io/badge/Sister%20app-FinChronicle-185FA5?style=flat)](https://github.com/kiren-labs/finchronicle)

---

## What it does

| Feature | Description |
|---|---|
| **Daily logbook** | Write what happened with each child today — free text, mood tag, date |
| **Good deed points** | Award points for named deeds (helping, kindness, homework). Points build toward milestones and badges. |
| **Parent reflection** | A private journal layer for parents to record how *they* showed up — separate from the child's record |
| **Psychology engine** | Age-appropriate weekly activity suggestions based on Piaget and Erikson developmental stages |
| **History timeline** | Full chronological memory book, filterable by child, mood, date |
| **Offline first** | Everything works after the first load — airplane mode, no signal, no problem |
| **Family profiles** | Up to 5 children per family, each with their own colour, avatar, and profile |
| **Sibling fairness** | Age-normalised points display so siblings aren't unfairly compared (v1.1) |

---

## Live app

**[https://kiren-labs.github.io/kidchronicle](https://kiren-labs.github.io/kidchronicle)**

No install required. Open in any browser. Add to your home screen for the full PWA experience.

| Platform | Browser | Install |
|---|---|---|
| iOS | Safari | Share → Add to Home Screen |
| Android | Chrome | Menu → Install App |
| Desktop | Chrome / Edge | Address bar install icon |

---

## Quick start for developers

```bash
# 1. Clone
git clone https://github.com/kiren-labs/kidchronicle.git
cd kidchronicle

# 2. Serve locally (no build step needed)
python3 -m http.server 8080
# or
npx serve .

# 3. Open in browser
open http://localhost:8080

# 4. Open DevTools → Application → IndexedDB to watch data writes
```

That is the entire setup. No `npm install`. No environment variables. No Docker. No config files.

---

## Repository structure

```
kidchronicle/
│
├── index.html                   ← single entry point — all screens live here
├── manifest.json                ← PWA install metadata
├── service-worker.js            ← offline asset cache (cache-first strategy)
│
├── css/
│   ├── reset.css                ← CSS normalisation
│   ├── app.css                  ← layout, components, CSS tokens
│   └── themes.css               ← child avatar colour tokens
│
├── js/
│   ├── app.js                   ← router, screen management, SW registration
│   ├── storage.js               ← IndexedDB + localStorage abstraction layer
│   ├── profiles.js              ← family and child CRUD, age calculation
│   ├── logbook.js               ← child log entries (logEntries store)
│   ├── reflection.js            ← parent self-reflection (parentReflections store)
│   ├── points.js                ← points awards, totals, streaks, badges
│   ├── psychology.js            ← age-based activity suggestion engine
│   ├── charts.js                ← canvas bar charts (no library)
│   └── export.js                ← JSON export and import
│
├── assets/
│   ├── icons/                   ← PWA icons: 192px and 512px
│   ├── avatars/                 ← SVG child avatar options
│   └── data/
│       ├── suggestions.json     ← psychology engine content (30+ per age band)
│       └── reflection-prompts.json  ← guided parent prompts (12, weekly rotation)
│
├── README.md                    ← this file
├── ARCHITECTURE.md              ← arc42 architecture documentation
├── PROJECT_PLAN.md              ← 20-day development plan with Git workflow
├── UX_WIREFRAMES.md             ← screen specifications and design decisions
├── CONTRIBUTING.md              ← how to contribute
├── SECURITY.md                  ← security policy and vulnerability reporting
├── CODING_STANDARDS.md          ← code style and module rules
└── CHANGELOG.md                 ← version history
```

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| UI | HTML5 + CSS3 | No framework — zero dependency rot, fully auditable |
| Logic | Vanilla JavaScript (ES6+) | No build step — runs directly from the filesystem |
| Storage (small) | `localStorage` | Synchronous, fast, sufficient for profiles (< 10 KB) |
| Storage (large) | `IndexedDB` | Handles unbounded log history with indexed queries |
| Offline | Service Worker (cache-first) | Works in airplane mode after first load |
| Charts | `<canvas>` 2D API | No charting library — zero runtime dependencies |
| Deploy | GitHub Pages | Free, zero ops, served via HTTPS automatically |

**Runtime dependencies: zero.**

---

## Documentation

All documentation lives in the repo root as markdown files — readable on GitHub without any tools.

| File | What it covers |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Full arc42 architecture doc: context, building blocks, runtime scenarios, ADRs, quality requirements, risk register |
| [`PROJECT_PLAN.md`](PROJECT_PLAN.md) | 20-day execution plan with daily task tables, Git workflow, milestone gates, definition of done |
| [`UX_WIREFRAMES.md`](UX_WIREFRAMES.md) | Screen specs with ASCII wireframes, interaction patterns, CSS tokens, accessibility requirements |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branch strategy, commit conventions, PR process, code review rules |
| [`CODING_STANDARDS.md`](CODING_STANDARDS.md) | Module rules, naming conventions, forbidden patterns, code style |
| [`SECURITY.md`](SECURITY.md) | Security model, privacy guarantees, vulnerability reporting |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history — updated on every release |

---

## Key design decisions

**Why no framework?**
No React, Vue, or Angular means no build step, no dependency updates, no version conflicts, and code that runs directly from the filesystem. The app will still work in 10 years without touching it.

**Why no server?**
Storing children's data on a server creates COPPA (US) and GDPR-K (EU) obligations. Keeping everything on the parent's device eliminates that legal surface entirely. It also means zero hosting cost and no single point of failure.

**Why separate stores for child logs and parent reflections?**
This is a structural privacy guarantee. Child-facing screens have no code path to `parentReflections`. See [ADR-006](ARCHITECTURE.md#adr-006--parent-reflections-in-a-separate-indexeddb-store) for the full rationale.

**Why no point deductions?**
The over-justification effect (Lepper et al., 1973) shows that external punishments for behaviour can undermine intrinsic motivation. Points are positive-only. See [ADR-005](ARCHITECTURE.md#adr-005--points-are-additive-only-no-deductions-in-v1).

---

## Releases

| Version | Date | What shipped |
|---|---|---|
| [v1.0.0](CHANGELOG.md#v100) | Day 14 | Core loop: profiles, logbook, points, psychology engine, history, offline |
| [v1.1.0](CHANGELOG.md#v110) | Day 20 | Sibling fairness, streaks, badges, parent reflection, QR sync, push notifications |

---

## Roadmap (v2.0)

- Child-facing display mode (read-only, shown by parent)
- Offline mini-games per age group (canvas, no library)
- Printable year-in-review PDF
- Optional cloud sync (E2E encrypted, opt-in)
- AI-powered parent reflection insights (Anthropic API, opt-in)

---

## Sister project

**[FinChronicle](https://github.com/kiren-labs/finchronicle)** — personal finance transaction logging.
Same kiren-labs family. Same stack. Separate product, separate user group.

---

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a PR.

Short version:
- All work on `feature/*` or `fix/*` branches — never push directly to `main`
- Commit messages follow Conventional Commits: `feat(logbook): add mood selector`
- PRs require at least one review before merge
- Run the [quality checklist](PROJECT_PLAN.md#9-definition-of-done) before marking a PR ready

---

## Privacy

KidChronicle stores all data locally on your device using `localStorage` and `IndexedDB`. Nothing is transmitted to any server during normal use. See [`SECURITY.md`](SECURITY.md) for the full privacy model.

---

## License

MIT — see [`LICENSE`](LICENSE).

---

*kiren-labs · [github.com/kiren-labs](https://github.com/kiren-labs)*
