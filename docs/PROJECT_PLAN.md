# KidChronicle — 20-Day Project Plan

> **Your child's story, one day at a time.**
> `github.com/kiren-labs/kidchronicle` · Plain HTML / CSS / Vanilla JS · No build step · No framework

---

## Quick reference

| | |
|---|---|
| **Repo** | `github.com/kiren-labs/kidchronicle` |
| **Default branch** | `main` |
| **Release branch** | `release/v1.0` (cut Day 12) |
| **v1.0 ship date** | End of Day 14 |
| **v1.1 ship date** | End of Day 20 |
| **Stack** | HTML / CSS / Vanilla JS · IndexedDB · Service Worker |
| **Deploy** | GitHub Pages (root, `main` branch) |
| **Document owner** | `[OPEN — fill in your name]` |
| **Last updated** | `[UPDATE DAILY]` |

---

## Table of contents

1. [How to read this document](#1-how-to-read-this-document)
2. [Project overview](#2-project-overview)
3. [Team, roles, and ownership](#3-team-roles-and-ownership)
4. [Git workflow — complete reference](#4-git-workflow--complete-reference)
5. [Milestone gates](#5-milestone-gates)
6. [Days 1–10 — Sprint 1: Foundation](#6-days-110--sprint-1-foundation)
7. [Days 11–20 — Sprint 2: Depth + Release](#7-days-1120--sprint-2-depth--release)
8. [Daily standup protocol](#8-daily-standup-protocol)
9. [Definition of done](#9-definition-of-done)
10. [Current project status — new joiner snapshot](#10-current-project-status--new-joiner-snapshot)

---

## 1. How to read this document

| Section | Question it answers | Who reads it |
|---|---|---|
| Section 1 | How do I navigate this document? | Everyone — read first |
| Section 2 | What are we building and what are the goals? | New joiners, stakeholders |
| Section 3 | Who owns what? | Every team member |
| Section 4 | How does Git work on this project? | Every developer |
| Section 5 | What are the milestone gates? | Tech lead, QA |
| Section 6 | Days 1–10: what happened and what do I do today? | Sprint 1 team |
| Section 7 | Days 11–20: what is coming next? | Sprint 2 team |
| Section 8 | How do I run a daily standup? | Team lead |
| Section 9 | What does "done" mean? | Developer, QA |
| Section 10 | What is the current status right now? | New joiner, manager |

> **🆕 New joiner?** Go to [Section 10](#10-current-project-status--new-joiner-snapshot) first. It tells you exactly what is done, in progress, blocked, and what to pick up today. Then come back to [Section 4](#4-git-workflow--complete-reference) to set up Git.

---

## 2. Project overview

### 2.1 What we are building

KidChronicle is a **Progressive Web App (PWA)** for parents to:
- Log daily interactions with their children
- Award points for good behaviour
- Reflect on their own parenting (parent self-reflection layer)
- Receive age-appropriate activity suggestions (psychology engine)
- Browse a full chronological history — a keepsake memory book

Runs **entirely in the browser**. No server. No account. No dependencies. All data stays on the parent's device.

### 2.2 Goals for this 20-day plan

| ID | Goal | Success criterion | Target day |
|---|---|---|---|
| G-1 | Repo live | GitHub repo created, README written, GitHub Pages active | Day 1 |
| G-2 | Storage green | `db.js` reads, writes, deletes, survives reload — Gate M1 passes | Day 2 |
| G-3 | Profiles working | Parent can add 3 children, reload, see all 3 intact | Day 4 |
| G-4 | Core loop done | Log entry → points → history works end to end | Day 10 |
| G-5 | Offline confirmed | All features work offline in Chrome DevTools AND iOS Safari | Day 12 |
| G-6 | **v1.0 shipped** | QR-01–QR-07 pass, privacy policy live, deployed, tagged `v1.0.0` | **Day 14** |
| G-7 | Sibling view live | Age-normalised sibling comparison working | Day 16 |
| G-8 | **v1.1 shipped** | QR sync on 2 devices, parent reflection, streaks, badges — tagged `v1.1.0` | **Day 20** |

### 2.3 Tech stack constraints

- **No** React, Vue, npm, Node, or build step at runtime
- **PWA:** `manifest.json` + service worker for offline + home screen install
- **Storage:** `localStorage` for settings/profiles · `IndexedDB` for log entries, points events, parent reflections
- **Deploy:** GitHub Pages from `main` branch · zero hosting cost

---

## 3. Team, roles, and ownership

| Role | Person | Responsibilities | Git access |
|---|---|---|---|
| Tech Lead | `[OPEN]` | Architecture, code review, merge to main, release tagging | Admin — push to `main`, create tags |
| Frontend Dev | `[OPEN]` | HTML/CSS/JS modules, canvas charts, PWA shell | Write to `feature/*` and `fix/*` |
| QA / Testing | `[OPEN]` | Manual device testing, quality checklist, gate sign-off | Read + create issues |
| Content (psych) | `[OPEN]` | Write `suggestions.json` (30+ per age group), review prompts | Read + PR to `content/*` |
| Product Owner | `[OPEN]` | Prioritisation, open question decisions, stakeholder comms | Read, approve PRs |

> **Solo developer rule:** Do all commits from feature branches anyway. Never push directly to `main`. The discipline of PRs — even self-reviewed — keeps history clean and lets any future joiner understand every decision.

---

## 4. Git workflow — complete reference

### 4.1 Initial repository setup *(Day 1, one-time)*

```bash
# 1. Create repo on GitHub: kiren-labs/kidchronicle (public, no README yet)

# 2. Clone and initialise locally
git clone https://github.com/kiren-labs/kidchronicle.git
cd kidchronicle

# 3. Create full directory and file scaffold
mkdir -p css js assets/icons assets/avatars
touch index.html manifest.json service-worker.js
touch css/reset.css css/app.css css/themes.css
touch js/app.js js/storage.js js/profiles.js js/logbook.js
touch js/reflection.js js/points.js js/psychology.js js/charts.js js/export.js
touch README.md CHANGELOG.md .gitignore

# 4. First commit
git add .
git commit -m "chore: initial project scaffold"
git push origin main

# 5. Enable GitHub Pages
# Repo Settings > Pages > Source: main branch / root folder
```

### 4.2 Branch naming convention

| Pattern | Example | Use for |
|---|---|---|
| `feature/<name>` | `feature/db-indexeddb` | New feature or module |
| `fix/<name>` | `fix/ios-service-worker` | Bug fix on any branch |
| `content/<name>` | `content/suggestions-age7` | Content-only JSON/copy changes |
| `release/v<x.y>` | `release/v1.0` | Release candidate — cut from `main` on Day 12 |
| `hotfix/<name>` | `hotfix/storage-crash` | Emergency fix on a released version |

### 4.3 Daily developer workflow

```bash
# ── Morning: always start from latest main ──────────────────────────────────
git checkout main
git pull origin main

# ── Create your feature branch for today's task ─────────────────────────────
git checkout -b feature/logbook-entry-ui

# ── Work in small logical commits (not one big commit per day) ───────────────
git add js/logbook.js css/app.css
git commit -m "feat(logbook): add entry form with mood tag selector"

git add js/logbook.js
git commit -m "feat(logbook): save entry to IndexedDB on submit"

# ── Push and open a PR ───────────────────────────────────────────────────────
git push origin feature/logbook-entry-ui
# Open PR on GitHub: base=main, compare=feature/logbook-entry-ui

# ── After PR is approved and merged ─────────────────────────────────────────
git checkout main
git pull origin main
git branch -d feature/logbook-entry-ui
git push origin --delete feature/logbook-entry-ui
```

### 4.4 Commit message convention

Format: `<type>(<scope>): <short description>`

| Type | Scope examples | When to use |
|---|---|---|
| `feat` | `db`, `profiles`, `logbook`, `points`, `reflection` | New feature or capability |
| `fix` | `storage`, `sw`, `ios` | Bug fix |
| `chore` | `scaffold`, `deps`, `ci` | Setup, config — no production code change |
| `docs` | `readme`, `changelog`, `prd` | Documentation only |
| `style` | `css`, `layout`, `typography` | Visual changes, no logic change |
| `refactor` | `db`, `charts` | Code restructure, no behaviour change |
| `test` | `db`, `logbook` | Adding or fixing tests |
| `content` | `suggestions`, `prompts` | JSON content files only |

**Good examples:**
```bash
git commit -m "feat(db): add IndexedDB CRUD wrappers"
git commit -m "fix(ios): handle service worker cache on Safari 16"
git commit -m "content(suggestions): add 30 age-7 activity entries"
git commit -m "docs(readme): update setup instructions for new joiners"
```

### 4.5 Release tagging

```bash
# ── Day 12: feature freeze — cut release branch ──────────────────────────────
git checkout main
git pull origin main
git checkout -b release/v1.0
git push origin release/v1.0
# After this point: NO new features on release/v1.0 — bugfixes only

# ── Day 14: ship v1.0 ────────────────────────────────────────────────────────
git checkout main
git merge release/v1.0          # merge any release-branch fixes back
git tag -a v1.0.0 -m "KidChronicle v1.0.0 — Foundation release"
git push origin v1.0.0
# Publish GitHub Release with tag v1.0.0 and CHANGELOG notes

# ── Day 20: ship v1.1 ────────────────────────────────────────────────────────
git tag -a v1.1.0 -m "KidChronicle v1.1.0 — Depth release"
git push origin v1.1.0
```

### 4.6 Complete Git command reference

| Action | Command | When |
|---|---|---|
| Clone repo | `git clone https://github.com/kiren-labs/kidchronicle.git` | Day 1 or new joiner |
| Create feature branch | `git checkout -b feature/<name>` | Start of every task |
| Stage all changes | `git add .` | Before commit |
| Stage specific file | `git add js/db.js` | Selective staging |
| Commit | `git commit -m "feat(db): add wrapper"` | After each logical unit |
| Push branch | `git push origin feature/<name>` | Before opening PR |
| Pull latest main | `git pull origin main` | Every morning |
| Rebase on main | `git fetch origin && git rebase origin/main` | Before merging feature |
| View log | `git log --oneline --graph --all` | Understand history |
| View status | `git status` | At any time |
| Undo last commit | `git reset --soft HEAD~1` | Fix commit before push |
| Stash work | `git stash` / `git stash pop` | Switch context quickly |
| Tag release | `git tag -a v1.0.0 -m "msg" && git push origin v1.0.0` | Release day |
| Delete local branch | `git branch -d feature/<name>` | After PR merged |
| Delete remote branch | `git push origin --delete feature/<name>` | After PR merged |
| Cherry-pick hotfix | `git cherry-pick <commit-hash>` | Apply fix to release branch |
| List all branches | `git branch -a` | Check for stale branches |
| Show commit detail | `git show <commit-hash>` | Debug a specific change |

---

## 5. Milestone gates

> A gate is a **hard stop**. Nothing moves to the next phase until the gate passes. The Tech Lead signs off on each gate. Update the Result column below as gates are passed.

| Gate | Day | Condition | Owner | Result |
|---|---|---|---|---|
| **M1** | End Day 2 | `db.js` CRUD + localStorage helpers. Read, write, delete, reload — all pass | Tech Lead | ⏳ Pending |
| **M2** | End Day 4 | Family + 3 children created, reloaded, all 3 intact. Age calculates correctly | Tech Lead | ⏳ Pending |
| **M3** | End Day 8 | Core loop: child → log entry → mood → points → history. End to end. | Tech Lead | ⏳ Pending |
| **M4** | End Day 10 | Psychology engine: 3 suggestions per child, age-filtered, sibling-aware. Pool ≥ 30 | Tech Lead | ⏳ Pending |
| **M5** | End Day 12 | Offline: all features work in Chrome DevTools offline AND iOS Safari offline | QA | ⏳ Pending |
| **M6** | End Day 14 | QR-01–QR-07 pass · privacy policy live · GitHub Pages deployed · `v1.0.0` tagged | Tech Lead | ⏳ Pending |
| **M7** | End Day 18 | Sibling view · streaks · badges · parent reflection · QR sync on 2 real devices | Tech Lead | ⏳ Pending |
| **M8** | End Day 20 | Full QA pass · CHANGELOG updated · `v1.1.0` tagged · announcement drafted | Tech Lead | ⏳ Pending |

> Update `⏳ Pending` → `✅ PASS` or `❌ FAIL` as each gate is reached.

---

## 6. Days 1–10 — Sprint 1: Foundation

> **Sprint 1 goal:** By end of Day 10, a parent can add children, write a log entry, award points, get a psychology suggestion, and browse history — **fully offline**. This is the minimum viable daily habit.

---

### Day 1 — Repository, scaffold, PWA shell

**Goal:** Repo is live on GitHub Pages. File structure exists. First commit pushed.
**Gate:** none · **Owner:** Tech Lead

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 1.1 | Create GitHub repo `kiren-labs/kidchronicle` (public) | `git clone https://github.com/kiren-labs/kidchronicle.git` | Tech Lead | ⬜ Pending |
| 1.2 | Create full directory + file scaffold | `mkdir -p css js assets/icons assets/avatars` | Tech Lead | ⬜ Pending |
| 1.3 | Write `README.md` — project overview + setup instructions | `git commit -m "docs: add README"` | Tech Lead | ⬜ Pending |
| 1.4 | Create `manifest.json` — name, icons, theme colour | `git commit -m "feat(pwa): add manifest.json"` | Tech Lead | ⬜ Pending |
| 1.5 | Create `service-worker.js` skeleton — cache list, no logic yet | `git commit -m "feat(pwa): add service worker skeleton"` | Tech Lead | ⬜ Pending |
| 1.6 | Create `index.html` — bottom nav shell, empty screen divs | `git commit -m "feat(shell): add index.html scaffold"` | Tech Lead | ⬜ Pending |
| 1.7 | Enable GitHub Pages in repo Settings → Pages → root / main | `git push origin main` | Tech Lead | ⬜ Pending |
| 1.8 | Verify live URL loads in browser and on mobile | `git tag day1-scaffold && git push origin day1-scaffold` | Tech Lead | ⬜ Pending |

**📦 Day 1 deliverable:** `https://kiren-labs.github.io/kidchronicle` is live. Blank shell renders. All JS/CSS files exist (empty). README explains the project to a new joiner in under 5 minutes.

---

### Day 2 — Storage layer (`db.js`) — Gate M1

**Goal:** `db.js` is complete and tested. Gate M1 signed off.
**Gate: M1** · **Owner:** Tech Lead

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 2.1 | Write `db.js`: `openDB()` — `kidchronicle` database v1 | `git checkout -b feature/db-indexeddb` | Tech Lead | ⬜ Pending |
| 2.2 | Create 3 object stores: `logEntries`, `pointsEvents`, `parentReflections` | `git commit -m "feat(db): create IndexedDB schema v1"` | Tech Lead | ⬜ Pending |
| 2.3 | Write generic `add()`, `get()`, `getAll()`, `delete()` wrappers | `git commit -m "feat(db): add CRUD wrappers"` | Tech Lead | ⬜ Pending |
| 2.4 | Write localStorage helpers: `saveLocal()`, `getLocal()` | `git commit -m "feat(db): add localStorage helpers"` | Tech Lead | ⬜ Pending |
| 2.5 | Write `db-test.html` — manually test all CRUD operations | `git commit -m "test(db): add manual test harness"` | Tech Lead | ⬜ Pending |
| 2.6 | Test: write entry → reload → entry still exists | *(manual test in browser)* | Tech Lead | ⬜ Pending |
| 2.7 | Test: delete entry → reload → entry gone | *(manual test in browser)* | Tech Lead | ⬜ Pending |
| 2.8 | PR → review → merge to `main` → **Gate M1 sign-off** | `git push origin feature/db-indexeddb` → open PR | Tech Lead | ⬜ Pending |

> **🚦 Gate M1 checklist before merging:**
> - [ ] All CRUD operations work without console errors
> - [ ] Data survives full browser reload
> - [ ] `getLocal()` returns saved values after reload
> - [ ] IndexedDB visible in DevTools → Application → IndexedDB
>
> **Nothing else starts until M1 passes.**

---

### Day 3 — Family and child profiles (`profiles.js`)

**Goal:** Parent can create a family and add up to 5 children.
**Gate:** none · **Owner:** Frontend Dev

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 3.1 | Write `profiles.js`: `saveFamily()`, `getFamily()`, `saveChildren()`, `getChildren()` | `git checkout -b feature/profiles` | Dev | ⬜ Pending |
| 3.2 | Write `calcAge(dateOfBirth)` — returns `{ years, months }` at runtime | `git commit -m "feat(profiles): add age utility"` | Dev | ⬜ Pending |
| 3.3 | Build onboarding Step 1 UI: family name input + Continue | `git commit -m "feat(ui): onboarding step 1"` | Dev | ⬜ Pending |
| 3.4 | Build onboarding Step 2 UI: child name, DOB picker, avatar colour | `git commit -m "feat(ui): onboarding step 2"` | Dev | ⬜ Pending |
| 3.5 | Build onboarding Step 3 UI: done screen → go to Home | `git commit -m "feat(ui): onboarding step 3"` | Dev | ⬜ Pending |
| 3.6 | Render child profile cards on Home screen from saved data | `git commit -m "feat(home): render child cards"` | Dev | ⬜ Pending |
| 3.7 | PR → review → merge to `main` | `git push origin feature/profiles` → open PR | Tech Lead | ⬜ Pending |

---

### Day 4 — Profile polish + Gate M2

**Goal:** Full profile CRUD, edit and delete. Gate M2 sign-off.
**Gate: M2** · **Owner:** Frontend Dev

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 4.1 | Edit child: name, DOB, avatar colour change | `git checkout -b feature/profile-edit` | Dev | ⬜ Pending |
| 4.2 | Delete child: confirmation dialog + cascade delete of all entries | `git commit -m "feat(profiles): add edit and delete"` | Dev | ⬜ Pending |
| 4.3 | Handle first-launch vs returning user in `app.js` router | `git commit -m "feat(app): first-launch detection"` | Dev | ⬜ Pending |
| 4.4 | Home empty state when no children added | `git commit -m "feat(home): empty state"` | Dev | ⬜ Pending |
| 4.5 | Test: add 3 children → reload → all 3 intact | *(manual test)* | QA | ⬜ Pending |
| 4.6 | Test: age calculates correctly for DOBs across years | *(manual test)* | QA | ⬜ Pending |
| 4.7 | PR → review → merge → **Gate M2 sign-off** | `git push origin feature/profile-edit` → open PR | Tech Lead | ⬜ Pending |

---

### Day 5 — Log entry + parent reflection (`logbook.js` + `reflection.js`)

**Goal:** Parent can write a child log entry AND a personal reflection entry.
**Gate:** none · **Owner:** Frontend Dev

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 5.1 | Write `logbook.js`: `addEntry()`, `getEntries()`, `editEntry()`, `deleteEntry()` | `git checkout -b feature/logbook` | Dev | ⬜ Pending |
| 5.2 | Log Entry screen: child selector chips, text area, date picker | `git commit -m "feat(logbook): entry form UI"` | Dev | ⬜ Pending |
| 5.3 | Mood tag selector — 5 options: great, good, proud, ok, tired | `git commit -m "feat(logbook): mood tag selector"` | Dev | ⬜ Pending |
| 5.4 | Write `reflection.js`: `addReflection()`, `getReflections()`, `deleteReflection()` | `git commit -m "feat(reflection): CRUD module"` | Dev | ⬜ Pending |
| 5.5 | Entry type toggle: **About my child** \| **About myself** | `git commit -m "feat(logbook): reflection toggle"` | Dev | ⬜ Pending |
| 5.6 | Parent mood tags in reflection mode: patient, present, reactive, distracted, tired | `git commit -m "feat(reflection): parent mood tags"` | Dev | ⬜ Pending |
| 5.7 | Guided prompts below text field in reflection mode (3 optional prompts) | `git commit -m "feat(reflection): guided prompts"` | Dev | ⬜ Pending |
| 5.8 | PR → review → merge to `main` | `git push origin feature/logbook` → open PR | Tech Lead | ⬜ Pending |

> **⚠️ Critical:** `reflection.js` must **never** import from or write to `logbook.js`. They are separate modules writing to separate IndexedDB stores. This is enforced at architecture level.

---

### Day 6 — Points and rewards (`points.js`)

**Goal:** Parent can award points to a child; totals update correctly.
**Gate:** none · **Owner:** Frontend Dev

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 6.1 | Write `points.js`: `awardPoints()`, `getPointsEvents()`, `getTotalPoints()` | `git checkout -b feature/points` | Dev | ⬜ Pending |
| 6.2 | Points deed chips: Helped someone +10, Kind words +8, Homework +7, Tidied +5 | `git commit -m "feat(points): deed chip UI"` | Dev | ⬜ Pending |
| 6.3 | Custom chip: opens numeric input for ad-hoc point values | `git commit -m "feat(points): custom points input"` | Dev | ⬜ Pending |
| 6.4 | Single Save button: writes log entry + points event in same IndexedDB transaction | `git commit -m "feat(logbook): atomic save with points"` | Dev | ⬜ Pending |
| 6.5 | Running total on child card (Home screen) | `git commit -m "feat(home): running points total"` | Dev | ⬜ Pending |
| 6.6 | Customisable categories: parent can rename, add, reorder categories | `git commit -m "feat(points): customisable categories"` | Dev | ⬜ Pending |
| 6.7 | PR → review → merge to `main` | `git push origin feature/points` → open PR | Tech Lead | ⬜ Pending |

---

### Day 7 — History timeline + JSON export

**Goal:** Parent can browse all log entries, filter by child/mood/date, and export as JSON.
**Gate:** none · **Owner:** Frontend Dev

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 7.1 | History screen: paginated list, 20 per page, newest first | `git checkout -b feature/history` | Dev | ⬜ Pending |
| 7.2 | Filter chips: All children, per child, mood tags, This week, This month | `git commit -m "feat(history): filter chips"` | Dev | ⬜ Pending |
| 7.3 | Entry card: colour dot · name · date · text preview · mood chip · points badge | `git commit -m "feat(history): entry card"` | Dev | ⬜ Pending |
| 7.4 | **My Journey** filter: shows only `parentReflections` with parent icon (neutral grey) | `git commit -m "feat(history): my journey filter"` | Dev | ⬜ Pending |
| 7.5 | Entry detail: tap to expand, edit and delete inside detail only | `git commit -m "feat(history): entry detail"` | Dev | ⬜ Pending |
| 7.6 | Write `export.js`: serialise all stores to JSON → file download | `git commit -m "feat(export): JSON export"` | Dev | ⬜ Pending |
| 7.7 | Test export: download → verify all entries + profiles in JSON | *(manual test)* | QA | ⬜ Pending |
| 7.8 | PR → review → merge to `main` | `git push origin feature/history` → open PR | Tech Lead | ⬜ Pending |

---

### Day 8 — Child profile screen + Gate M3

**Goal:** Full child profile with stats and points chart. Gate M3 sign-off.
**Gate: M3** · **Owner:** Frontend Dev

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 8.1 | Child Profile screen: avatar, name, age, sibling flag, join date | `git checkout -b feature/child-profile` | Dev | ⬜ Pending |
| 8.2 | Three stat boxes: total points / log entry count / current streak | `git commit -m "feat(profile): stat boxes"` | Dev | ⬜ Pending |
| 8.3 | Points bar chart: 8-week rolling — drawn on `<canvas>` (no library) | `git commit -m "feat(charts): 8-week points chart"` | Dev | ⬜ Pending |
| 8.4 | Stress test chart: 2 years of synthetic data (730 entries) — still responsive | *(manual test)* | QA | ⬜ Pending |
| 8.5 | Test full core loop: child → log → mood → points → history → profile chart | *(manual end-to-end)* | QA | ⬜ Pending |
| 8.6 | Fix any bugs from end-to-end test | `git checkout -b fix/<issue>` | Dev | ⬜ Pending |
| 8.7 | PR → review → merge → **Gate M3 sign-off** | `git push origin feature/child-profile` → open PR | Tech Lead | ⬜ Pending |

---

### Day 9 — Psychology engine (`psychology.js`)

**Goal:** Age-appropriate activity suggestions surface on the child profile screen.
**Gate:** none · **Owner:** Dev + Content

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 9.1 | Write `psychology.js`: `getSuggestions(childAge, hasSiblings)` | `git checkout -b feature/psychology` | Dev | ⬜ Pending |
| 9.2 | Load `suggestions.json`, filter by `ageMin`/`ageMax` + `siblingRequired` | `git commit -m "feat(psychology): age filter engine"` | Dev | ⬜ Pending |
| 9.3 | Recency exclusion: skip suggestions shown in last 4 weeks for this child | `git commit -m "feat(psychology): recency exclusion"` | Dev | ⬜ Pending |
| 9.4 | Return 3 per call; fallback to repeats if pool is small | `git commit -m "feat(psychology): suggestion selection"` | Dev | ⬜ Pending |
| 9.5 | Write `suggestions.json`: ≥10 placeholder entries (full 30+ by Day 16) | `git checkout -b content/suggestions-placeholder` | Content | ⬜ Pending |
| 9.6 | Display weekly suggestion card on child profile (amber, dismissible) | `git commit -m "feat(profile): suggestion card UI"` | Dev | ⬜ Pending |
| 9.7 | PR both branches → review → merge | `git push origin feature/psychology` → open PR | Tech Lead | ⬜ Pending |

---

### Day 10 — Service worker (full offline) + Gate M4

**Goal:** App works fully offline after first load. Gate M4 sign-off.
**Gate: M4** · **Owner:** Tech Lead + QA

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 10.1 | Complete `service-worker.js`: cache all HTML/CSS/JS/JSON on install | `git checkout -b feature/service-worker` | Tech Lead | ⬜ Pending |
| 10.2 | Register SW in `app.js` with update detection | `git commit -m "feat(pwa): register service worker"` | Tech Lead | ⬜ Pending |
| 10.3 | Test Chrome: Network tab → Offline → all screens load | *(manual — Chrome DevTools)* | QA | ⬜ Pending |
| 10.4 | Test iOS Safari: Airplane mode after first load → all screens load | *(manual — real iOS device)* | QA | ⬜ Pending |
| 10.5 | Fix any offline failures (especially iOS `fetch()` quirks) | `git checkout -b fix/ios-offline-<issue>` | Dev | ⬜ Pending |
| 10.6 | Run full QR-01–QR-07 quality requirements checklist | *(manual checklist — Section 9)* | QA | ⬜ Pending |
| 10.7 | PR → review → merge → **Gate M4 sign-off** | `git push origin feature/service-worker` → open PR | Tech Lead | ⬜ Pending |

> **✅ End of Sprint 1 checkpoint**
> Core loop complete and offline. Do a 15-minute team retrospective. Update Section 10 status before Day 11 starts.

---

## 7. Days 11–20 — Sprint 2: Depth + Release

> **Sprint 2 goal:** v1.0 ships Day 14. v1.1 ships Day 20. Adds sibling fairness, streaks, badges, mood charts, QR sync, push notifications, and full suggestion content. Buffer days are 13–14 (v1.0 QA) and 19–20 (v1.1 hardening).

---

### Day 11 — Sibling fairness view + streak tracking

**Goal:** Age-normalised sibling scores display; streak counter live on child cards.
**Gate:** none · **Owner:** Frontend Dev

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 11.1 | Sibling normalisation: score as percentile within age-group range | `git checkout -b feature/sibling-fairness` | Dev | ⬜ Pending |
| 11.2 | Sibling comparison view on Home (shown only if `hasSiblings = true`) | `git commit -m "feat(home): sibling fairness view"` | Dev | ⬜ Pending |
| 11.3 | Hide raw scores by default in sibling view; parent toggles to reveal | `git commit -m "feat(home): hide raw sibling scores"` | Dev | ⬜ Pending |
| 11.4 | Streak logic in `points.js`: consecutive days with entry or points event | `git checkout -b feature/streaks` | Dev | ⬜ Pending |
| 11.5 | Streak on child card: 🔥 + count; hidden if streak = 0 | `git commit -m "feat(home): streak indicator"` | Dev | ⬜ Pending |
| 11.6 | PR both branches → review → merge | `git push origin feature/sibling-fairness` → open PR | Tech Lead | ⬜ Pending |

---

### Day 12 — Badge system + mood trend chart + **feature freeze**

**Goal:** Badges working; mood chart on child profile; feature freeze for v1.0.
**Gate: M5** · **Owner:** Frontend Dev

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 12.1 | Badge system: first entry · 50pts · 100pts · 250pts · 7-day streak | `git checkout -b feature/badges` | Dev | ⬜ Pending |
| 12.2 | Badge unlock: brief CSS transition on child profile screen | `git commit -m "feat(badges): milestone badges"` | Dev | ⬜ Pending |
| 12.3 | Mood trend chart: 30-day rolling canvas bar on child profile | `git checkout -b feature/mood-chart` | Dev | ⬜ Pending |
| 12.4 | Parent mood chart: 30-day distribution in **My Journey** view | `git commit -m "feat(charts): parent mood trend"` | Dev | ⬜ Pending |
| 12.5 | PR badges + mood-chart → review → merge | `git push origin feature/badges` → open PR | Tech Lead | ⬜ Pending |
| 12.6 | **FEATURE FREEZE** — cut `release/v1.0` branch from `main` | `git checkout -b release/v1.0 && git push origin release/v1.0` | Tech Lead | ⬜ Pending |
| 12.7 | Write `CHANGELOG.md` entry for v1.0 | `git commit -m "docs: v1.0 changelog"` | Tech Lead | ⬜ Pending |

> **🔒 Feature freeze rule:** After step 12.6, **no new features** go into `release/v1.0`. Bugfixes only via `hotfix/*` branches cherry-picked onto `release/v1.0`. New features continue on `feature/*` targeting `main` for v1.1.

---

### Day 13 — v1.0 QA day *(buffer)*

**Goal:** All QR-01–QR-07 quality requirements pass on `release/v1.0`.
**Gate:** M6 prep · **Owner:** QA + Dev

| # | Task | Command / method | Owner | Status |
|---|---|---|---|---|
| 13.1 | QR-01: log entry saves and UI updates in < 500ms on Android | *(manual timing test)* | QA | ⬜ Pending |
| 13.2 | QR-02: data intact after browser refresh mid-session | *(manual reload test)* | QA | ⬜ Pending |
| 13.3 | QR-03: all features offline — Chrome AND iOS Safari | *(manual offline — both platforms)* | QA | ⬜ Pending |
| 13.4 | QR-04: first log entry achievable in < 30s without reading instructions | *(fresh-install usability test)* | QA | ⬜ Pending |
| 13.5 | QR-05: 730 log entries + 2000 points events — app stays responsive | *(synthetic data load test)* | QA | ⬜ Pending |
| 13.6 | QR-06: zero external network requests during normal use | *(DevTools Network audit)* | QA | ⬜ Pending |
| 13.7 | QR-07: JSON export imports correctly on a fresh browser instance | *(manual export/import test)* | QA | ⬜ Pending |
| 13.8 | Fix all critical bugs via `hotfix/*` → cherry-pick to `release/v1.0` | `git checkout -b hotfix/<issue>` then `git cherry-pick <hash>` | Dev | ⬜ Pending |

---

### Day 14 — **v1.0 ship day** — Gate M6 🚀

**Goal:** v1.0 is live, tagged, announced. Release date achieved.
**Gate: M6** · **Owner:** Tech Lead

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 14.1 | Write privacy policy (plain HTML or linked page) | `git checkout -b feature/privacy-policy` | Tech Lead | ⬜ Pending |
| 14.2 | Link privacy policy from app settings screen | `git commit -m "feat(settings): link privacy policy"` | Dev | ⬜ Pending |
| 14.3 | Final QR-01–QR-07 pass: all green — Tech Lead confirms | *(final checklist sign-off)* | QA + Tech Lead | ⬜ Pending |
| 14.4 | Merge `release/v1.0` back to `main` | `git checkout main && git merge release/v1.0` | Tech Lead | ⬜ Pending |
| 14.5 | **Tag v1.0.0** on main | `git tag -a v1.0.0 -m "KidChronicle v1.0.0 — Foundation" && git push origin v1.0.0` | Tech Lead | ⬜ Pending |
| 14.6 | Verify GitHub Pages serving tagged version | *(check live URL)* | QA | ⬜ Pending |
| 14.7 | Draft release notes on GitHub | `git commit -m "docs: v1.0.0 release notes"` | Tech Lead | ⬜ Pending |
| 14.8 | **Publish GitHub Release** with tag `v1.0.0` and CHANGELOG | *(GitHub UI → New Release from tag)* | Tech Lead | ⬜ Pending |

> **🎉 v1.0 is live.** Share the GitHub Pages URL. Start collecting parent feedback immediately. Every piece of feedback is a v1.1 candidate.

---

### Day 15 — QR co-parent sync

**Goal:** Two parents on different devices can exchange data via QR code.
**Gate:** none · **Owner:** Tech Lead

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 15.1 | Design sync format: JSON export payload + version + timestamp | `git checkout -b feature/qr-sync` | Tech Lead | ⬜ Pending |
| 15.2 | Generate QR from JSON export using `qrcode.js` (CDN, no install) | `git commit -m "feat(sync): QR code generation"` | Dev | ⬜ Pending |
| 15.3 | QR scanner using device camera (`getUserMedia` + `jsQR` CDN) | `git commit -m "feat(sync): QR camera scanner"` | Dev | ⬜ Pending |
| 15.4 | Import handler: validate JSON schema before writing, warn on conflict | `git commit -m "feat(sync): import validation"` | Dev | ⬜ Pending |
| 15.5 | End-to-end test: Phone A exports QR → Phone B scans → all data present | *(2-device manual test)* | QA | ⬜ Pending |
| 15.6 | PR → review → merge to `main` | `git push origin feature/qr-sync` → open PR | Tech Lead | ⬜ Pending |

---

### Day 16 — Push notifications + full suggestion content

**Goal:** Opt-in daily reminder working; full 30+ suggestion pool per age group live.
**Gate:** none · **Owner:** Dev + Content

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 16.1 | SW push notification: request permission on Day 2 of use (not Day 1) | `git checkout -b feature/push-notifications` | Dev | ⬜ Pending |
| 16.2 | Daily 8pm reminder: "You haven't logged today" — dismissible, opt-out | `git commit -m "feat(sw): daily log reminder"` | Dev | ⬜ Pending |
| 16.3 | Complete `suggestions.json`: 30+ entries per age band (2–3, 4–6, 7–11, 12–14, 15+) | `git checkout -b content/suggestions-full` | Content | ⬜ Pending |
| 16.4 | Content review pass: verify all suggestions are age-appropriate and safe | *(manual content review)* | Content + QA | ⬜ Pending |
| 16.5 | `reflection-prompts.json`: 3 prompts × 4-week rotation = 12 total | `git commit -m "content: reflection prompts pool"` | Content | ⬜ Pending |
| 16.6 | PR both branches → review → merge | `git push origin feature/push-notifications` → open PR | Tech Lead | ⬜ Pending |

---

### Day 17 — UI polish + accessibility pass

**Goal:** WCAG 2.1 AA contrast and touch targets pass; all empty states correct.
**Gate:** none · **Owner:** Frontend Dev

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 17.1 | Audit all text: minimum contrast ratio 4.5:1 body / 3:1 large text | `git checkout -b fix/accessibility` | Dev | ⬜ Pending |
| 17.2 | All touch targets ≥ 44×44pt (FAB, mood chips, back button, nav tabs) | `git commit -m "fix(a11y): touch target sizing"` | Dev | ⬜ Pending |
| 17.3 | `aria-label` on all icon-only buttons; `aria-hidden` on decorative icons | `git commit -m "fix(a11y): aria labels"` | Dev | ⬜ Pending |
| 17.4 | All CSS transitions respect `prefers-reduced-motion` | `git commit -m "fix(a11y): reduced-motion support"` | Dev | ⬜ Pending |
| 17.5 | Verify all 5 empty states render correctly | *(manual visual test)* | QA | ⬜ Pending |
| 17.6 | Screen reader test: VoiceOver (iOS) + TalkBack (Android) on core screens | *(manual test — real devices)* | QA | ⬜ Pending |
| 17.7 | PR → review → merge to `main` | `git push origin fix/accessibility` → open PR | Tech Lead | ⬜ Pending |

---

### Day 18 — Performance + Gate M7

**Goal:** Stress test with 2-year data passes; all v1.1 features green. Gate M7 sign-off.
**Gate: M7** · **Owner:** Tech Lead + QA

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 18.1 | Data generator script: 730 log entries + 2000 points events | `git checkout -b fix/performance` | Dev | ⬜ Pending |
| 18.2 | Profile with synthetic data: History scroll, chart render, search speed | *(Chrome DevTools Performance tab)* | Tech Lead | ⬜ Pending |
| 18.3 | Fix IndexedDB query bottlenecks (add date index if missing) | `git commit -m "fix(db): optimise date index query"` | Dev | ⬜ Pending |
| 18.4 | QR sync end-to-end on 2 real physical devices (different OS) | *(2-device test)* | QA | ⬜ Pending |
| 18.5 | Full v1.1 feature check: sibling view, streaks, badges, reflection, QR sync — all green | *(manual checklist)* | QA | ⬜ Pending |
| 18.6 | Update `CHANGELOG.md` for v1.1 | `git commit -m "docs: v1.1 changelog"` | Tech Lead | ⬜ Pending |
| 18.7 | PR performance fixes → merge → **Gate M7 sign-off** | `git push origin fix/performance` → open PR | Tech Lead | ⬜ Pending |

---

### Day 19 — v1.1 QA buffer *(buffer day)*

**Goal:** Full regression green; app store assets prepared; v2.0 scope drafted.
**Gate:** M8 prep · **Owner:** QA + Dev

| # | Task | Method | Owner | Status |
|---|---|---|---|---|
| 19.1 | Full regression: every screen, every filter, every edge case | *(manual full regression)* | QA | ⬜ Pending |
| 19.2 | Fix all P1 and P2 bugs from regression | `git checkout -b fix/<issue>` | Dev | ⬜ Pending |
| 19.3 | App store screenshots: 6 screens on iPhone 14 Pro + 6 on Android | *(screenshot capture)* | Dev | ⬜ Pending |
| 19.4 | Write Google Play store listing description (max 4000 chars) | `git commit -m "docs: play store listing"` | Tech Lead | ⬜ Pending |
| 19.5 | Write Apple App Store listing description | `git commit -m "docs: app store listing"` | Tech Lead | ⬜ Pending |
| 19.6 | Draft v2.0 scope from v1.0 user feedback (update PRD Section 14.7) | *(update PRD)* | Product Owner | ⬜ Pending |

---

### Day 20 — **v1.1 ship day** — Gate M8 🚀

**Goal:** v1.1 live, tagged, announced. v2.0 scope written. Project handed over.
**Gate: M8** · **Owner:** Tech Lead

| # | Task | Git command | Owner | Status |
|---|---|---|---|---|
| 20.1 | Final QA pass on `main`: all v1.1 features green | *(final checklist)* | QA + Tech Lead | ⬜ Pending |
| 20.2 | Merge any remaining `fix/*` branches to `main` | `git checkout main && git merge fix/<name>` | Tech Lead | ⬜ Pending |
| 20.3 | **Tag v1.1.0** on main | `git tag -a v1.1.0 -m "KidChronicle v1.1.0 — Depth" && git push origin v1.1.0` | Tech Lead | ⬜ Pending |
| 20.4 | Verify GitHub Pages serving v1.1.0 | *(check live URL + cache headers)* | QA | ⬜ Pending |
| 20.5 | **Publish GitHub Release** with v1.1.0 + full CHANGELOG | *(GitHub UI → New Release)* | Tech Lead | ⬜ Pending |
| 20.6 | Submit to Google Play PWA track (review: 24–48h) | *(Google Play Console)* | Tech Lead | ⬜ Pending |
| 20.7 | Submit to Apple App Store (review: 1–2 weeks) | *(App Store Connect)* | Tech Lead | ⬜ Pending |
| 20.8 | Team retrospective: 30 min — what worked, what to improve for v2.0 | *(meeting)* | Whole team | ⬜ Pending |

> **🎉 v1.1.0 is live.** All documentation up to date. A new developer joining now should be able to read Section 10 and start contributing within 2 hours.

---

## 8. Daily standup protocol

**15 minutes maximum. Every morning before anyone writes code.**

Answers go in a Slack message or a daily comment on the GitHub issue for that day.

| # | Question | What a good answer looks like |
|---|---|---|
| 1 | What did I complete yesterday? | Reference task IDs. *"Completed 5.1–5.4, merged `feature/logbook` to `main`."* Not *"I worked on the logbook."* |
| 2 | What am I doing today? | Reference today's task IDs. *"Doing 6.1–6.4: `points.js` and deed chips."* |
| 3 | Is anything blocked? | Name the blocker specifically. *"6.2 blocked: unclear if deed chips save on tap or on Save button."* |
| 4 | Does any gate need attention? | If a gate is today or tomorrow: confirm criteria are understood and in progress. **Never discover a gate failure on gate day.** |

After standup, the team lead **updates Section 10** and the Status column for the current day. Takes 2 minutes. Makes the document useful for anyone joining mid-project.

---

## 9. Definition of done

> A task is **NOT done** until all conditions below are met. "It works on my machine" is not done.

- [ ] Code committed to a feature branch with a correct conventional commit message
- [ ] PR opened and reviewed (at minimum: self-review if solo)
- [ ] Merged to `main` via PR — **no direct pushes to `main`**
- [ ] Feature branch deleted after merge (`git branch -d` + `git push origin --delete`)
- [ ] Works in Chrome desktop — no console errors
- [ ] Works on iOS Safari — tested on real device or BrowserStack
- [ ] Data survives browser reload — state preserved after refresh
- [ ] Task row status updated to `✅ Done` in the relevant day table
- [ ] If gate day: gate signed off by Tech Lead in Section 5

---

## 10. Current project status — new joiner snapshot

> **⚠️ Update this section every morning after standup.** If it is out of date, it is useless.

### 10.1 At a glance

| Field | Value |
|---|---|
| Today's date | `[FILL IN DAILY]` |
| Current day in plan | `[e.g. Day 1]` |
| Current phase | `[e.g. Sprint 1: Foundation]` |
| Last gate passed | `[e.g. M1 — Storage green — Day 2]` or `None yet` |
| Next gate | `[e.g. M2 — Profiles — End of Day 4]` |
| v1.0 release date | `Day 14 — [fill in calendar date]` |
| v1.1 release date | `Day 20 — [fill in calendar date]` |
| Active branch | `[e.g. feature/logbook-entry-ui]` |
| Last merged PR | `[e.g. feature/db-indexeddb merged Day 2]` |
| Blockers | `None` or `[describe + owner]` |

### 10.2 What has been completed

```
[FILL IN DAILY — example:]
Day 1: Repo scaffold live on GitHub Pages. All JS/CSS files created.
Day 2: db.js complete. Gate M1 passed. All CRUD operations verified.
```

### 10.3 What is in progress right now

```
[FILL IN DAILY — example:]
Day 5 tasks 5.1–5.3 in progress on branch feature/logbook.
ETA: end of today.
```

### 10.4 What is next

```
[FILL IN DAILY — example:]
Day 6: points.js and deed chip UI.
Day 7 after that: history timeline and JSON export.
```

### 10.5 For a new joiner — what to do right now

1. Read [Section 2](#2-project-overview) (project overview) and [Section 3](#3-team-roles-and-ownership) (your role and Git access).
2. Read [Section 4](#4-git-workflow--complete-reference) and run the Day 1 Git setup commands — or clone the existing repo if it is already set up.
3. Check **Active branch** in [10.1](#101-at-a-glance). Pull `main`, create your feature branch, ask the Tech Lead which task to pick up.
4. Attend tomorrow's standup. Come with answers to the four questions in [Section 8](#8-daily-standup-protocol).
5. If anything is unclear, open a GitHub Discussion before assuming.

---

## Appendix: File structure

```
kidchronicle/
├── index.html              ← single entry point
├── manifest.json           ← PWA manifest (name, icons, theme)
├── service-worker.js       ← offline asset caching
├── CHANGELOG.md            ← version history — update on every release
├── PROJECT_PLAN.md         ← this file
├── css/
│   ├── reset.css
│   ├── app.css
│   └── themes.css          ← child avatar colour tokens
├── js/
│   ├── app.js              ← router + app initialisation
│   ├── storage.js          ← localStorage / IndexedDB abstraction (db.js)
│   ├── profiles.js         ← family + child profile CRUD
│   ├── logbook.js          ← child log entry CRUD
│   ├── reflection.js       ← parent self-reflection CRUD (separate module)
│   ├── points.js           ← points awards, categories, totals
│   ├── psychology.js       ← age-based suggestion engine
│   ├── charts.js           ← canvas bar charts (no library)
│   └── export.js           ← JSON export / import
└── assets/
    ├── icons/              ← PWA icons: 192px, 512px
    ├── avatars/            ← SVG child avatar options
    └── data/
        ├── suggestions.json         ← psychology engine content pool
        └── reflection-prompts.json  ← parent reflection guided prompts
```

---

## Appendix: Quality requirements checklist

Use this on Day 13 (v1.0 QA) and Day 19 (v1.1 QA).

| ID | Scenario | Acceptance criterion | Pass? |
|---|---|---|---|
| QR-01 | Log entry on mid-range Android | Saved + UI updated in < 500ms | ⬜ |
| QR-02 | Browser refreshed mid-session | All previously saved data intact on reload | ⬜ |
| QR-03 | Device goes offline after first load | All features work — no error states | ⬜ |
| QR-04 | Parent opens app for first time | First log entry completed without reading instructions | ⬜ |
| QR-05 | 730 log entries + 2000 points events (2yr data) | App remains responsive, no data loss | ⬜ |
| QR-06 | App audited for network calls | Zero requests to external servers during normal use | ⬜ |
| QR-07 | JSON export → fresh browser import | All data present and correctly rendered | ⬜ |

---

*KidChronicle · kiren-labs · v1.0 Release: Day 14 · v1.1 Release: Day 20*
*Update Section 10 every morning. Keep this file in the root of the repo.*