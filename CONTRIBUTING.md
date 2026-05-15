# CONTRIBUTING.md — KidChronicle

Thank you for contributing to KidChronicle. This document covers everything you need to contribute effectively — branch strategy, commit conventions, PR process, and review standards.

Read this before opening your first PR.

---

## Table of contents

1. [Before you start](#1-before-you-start)
2. [Branch strategy](#2-branch-strategy)
3. [Commit messages](#3-commit-messages)
4. [Pull request process](#4-pull-request-process)
5. [Code review standards](#5-code-review-standards)
6. [Definition of done](#6-definition-of-done)
7. [Reporting bugs](#7-reporting-bugs)
8. [Suggesting features](#8-suggesting-features)
9. [Content contributions](#9-content-contributions-suggestionsjson)

---

## 1. Before you start

1. Read [`ARCHITECTURE.md`](ARCHITECTURE.md) — understand module boundaries before touching any JS file
2. Read [`CODING_STANDARDS.md`](CODING_STANDARDS.md) — understand forbidden patterns
3. Read [`UX_WIREFRAMES.md`](UX_WIREFRAMES.md) — understand the design intent before changing any UI
4. Check open issues before starting — someone may already be working on it
5. For significant changes, open an issue to discuss before writing code

---

## 2. Branch strategy

### Rules

- **Never push directly to `main`**. All changes go through a PR.
- Branch from `main`. Merge back to `main` via PR.
- Delete your branch after it is merged.
- Keep branches short-lived — maximum 3 days before merging or rebasing.

### Branch naming

| Pattern | Example | Use for |
|---|---|---|
| `feature/<name>` | `feature/streak-tracking` | New feature or module |
| `fix/<name>` | `fix/ios-service-worker` | Bug fix |
| `content/<name>` | `content/suggestions-age4-6` | `suggestions.json` or prompt content only |
| `docs/<name>` | `docs/update-architecture` | Documentation only — no code changes |
| `refactor/<name>` | `refactor/storage-layer` | Code restructure with no behaviour change |
| `release/v<x.y>` | `release/v1.0` | Release candidate — cut by Tech Lead only |
| `hotfix/<name>` | `hotfix/data-loss-on-delete` | Emergency fix — applied to release branch |

### Daily workflow

```bash
# Start of every day
git checkout main
git pull origin main

# Create your branch
git checkout -b feature/your-task-name

# Work in small commits (see Section 3)

# Push and open PR
git push origin feature/your-task-name
```

---

## 3. Commit messages

Format: `<type>(<scope>): <short description in present tense>`

The description must complete the sentence: *"If applied, this commit will ______."*

### Types

| Type | When to use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `chore` | Setup, tooling, config — no production code change |
| `docs` | Documentation only |
| `style` | CSS/visual changes — no logic change |
| `refactor` | Code restructure — no behaviour change |
| `test` | Adding or fixing tests |
| `content` | `suggestions.json` or `reflection-prompts.json` only |
| `perf` | Performance improvement |

### Scope

Use the module name: `db`, `profiles`, `logbook`, `reflection`, `points`, `psychology`, `charts`, `export`, `sw`, `ui`, `a11y`, `pwa`.

### Good examples

```
feat(logbook): add back-date support to entry form
fix(storage): handle QuotaExceededError on IndexedDB write
docs(architecture): add ADR-007 for push notification strategy
content(suggestions): add 30 age-7 to age-11 activity entries
style(home): increase child card streak indicator font size
refactor(points): extract getTotalPoints to reduce duplication
perf(charts): aggregate to weekly totals before canvas render
```

### Bad examples

```
fixed stuff           ← no type, no scope, past tense, vague
WIP                   ← never commit WIP — stash instead
update logbook.js     ← no type, describes the file not the change
feat: big update      ← no scope, description is meaningless
```

### Commit size

Commit **one logical change** per commit. Not one file per commit. Not one day per commit.

If you can't describe what the commit does in one line without "and", it should be two commits.

---

## 4. Pull request process

### Opening a PR

1. Push your branch: `git push origin feature/<name>`
2. Open a PR on GitHub: base = `main`, compare = your branch
3. Use the PR title as a conventional commit message: `feat(logbook): add mood selector UI`
4. Fill in the PR description using the template below

### PR description template

```markdown
## What this does
[1-3 sentences describing the change]

## Why
[Link to issue, or 1 sentence explaining the motivation]

## Testing done
- [ ] Tested in Chrome desktop
- [ ] Tested on iOS Safari
- [ ] Data survives browser reload
- [ ] No console errors
- [ ] [Add any scenario-specific tests]

## Screenshots (if UI change)
[Before / After screenshots if the change is visual]

## Checklist
- [ ] Follows CODING_STANDARDS.md
- [ ] No direct push to main
- [ ] Branch named correctly
- [ ] Commit messages follow convention
- [ ] CHANGELOG.md updated if this is a user-facing change
```

### PR size guidelines

| Size | Lines changed | Rule |
|---|---|---|
| Small | < 100 lines | Preferred — fast to review, easy to understand |
| Medium | 100–300 lines | Acceptable — ensure the description is clear |
| Large | > 300 lines | Split into smaller PRs if possible. If not, add a detailed walkthrough in the description. |

### Merging

- PRs require **at least one approval** before merging
- The author merges their own PR after approval
- Use **Squash and merge** for `feature/*` and `fix/*` branches
- Use **Merge commit** for `release/*` branches (preserves release history)
- Delete the branch after merging

---

## 5. Code review standards

### Reviewer responsibilities

- Review within **24 hours** of a PR being marked ready
- Focus on: correctness, module boundary violations, security, usability impact
- Leave specific, actionable comments — not vague suggestions
- Approve only when you would be comfortable shipping this code

### What to check

| Area | What to look for |
|---|---|
| Module boundaries | Does `reflection.js` import from `logbook.js`? It must not. Does any module call IndexedDB directly without going through `storage.js`? It must not. |
| Storage writes | Are running totals being stored as fields? They must not be — only computed at read time. |
| Age field | Is `age` ever stored on a child profile? It must not — only `dateOfBirth`. |
| Error handling | Is every `catch` block either showing a user message or writing to the error log? Silent `catch` blocks are forbidden. |
| Console errors | Does the change introduce any `console.error` or unhandled promise rejections? |
| Data isolation | Could parent reflection data be visible in child-facing screens? |
| Accessibility | Are new interactive elements keyboard-navigable? Do icon-only buttons have `aria-label`? |

### What NOT to block PRs on

- Personal code style preferences not covered in `CODING_STANDARDS.md`
- Naming choices that follow the conventions but differ from your preference
- Minor whitespace or formatting differences

---

## 6. Definition of done

A task is **not done** until all of the following are true:

- [ ] Code committed to a feature branch — not `main`
- [ ] PR opened and reviewed (minimum: self-review if solo)
- [ ] Merged to `main` via PR — never directly
- [ ] Feature branch deleted after merge
- [ ] Works in Chrome desktop — no console errors
- [ ] Works on iOS Safari — tested on a real device
- [ ] Data survives browser reload
- [ ] Task row updated to ✅ Done in `PROJECT_PLAN.md`
- [ ] `CHANGELOG.md` updated if this is a user-facing change

---

## 7. Reporting bugs

Open a GitHub issue with the title: `bug: <short description>`

Include:

```markdown
## What happened
[Describe what went wrong]

## What you expected
[Describe what should have happened]

## Steps to reproduce
1. ...
2. ...
3. ...

## Environment
- OS:
- Browser + version:
- Device:
- App version (check CHANGELOG.md):

## Console errors (if any)
[Paste from DevTools Console]
```

**For data loss bugs:** open a GitHub issue immediately and label it `severity: critical`. Do not wait.

---

## 8. Suggesting features

Open a GitHub issue with the title: `feat: <short description>`

Include:

- What problem does this solve for a parent?
- Which screen or flow does it affect?
- Is this blocked by any of the architecture constraints in `ARCHITECTURE.md`?
- Is this in scope for v1, v1.1, or v2?

Features that conflict with these constraints will not be accepted for v1:
- No server or backend calls
- No npm or build step at runtime
- No storage of parent reflection data in child-facing stores
- No point deductions (see ADR-005)

---

## 9. Content contributions (`suggestions.json`)

The psychology engine's content pool (`assets/data/suggestions.json`) needs 30+ entries per age band. Contributions here are high-value and don't require coding skills.

### Age bands

| Band | Ages |
|---|---|
| Toddler | 2–3 years |
| Pre-school | 4–6 years |
| School age | 7–11 years |
| Early teen | 12–14 years |
| Teen | 15+ years |

### Suggestion format

```json
{
  "id": "sug_xxx",
  "ageMin": 7,
  "ageMax": 11,
  "siblingRequired": false,
  "category": "creativity",
  "title": "Draw your favourite animal",
  "description": "Ask them to draw their favourite animal and then explain 3 things about it. Encourages imagination and verbal explanation.",
  "eriksonTheme": "industry",
  "piagetConcept": "concrete operations"
}
```

### Contribution rules for content

- Suggestions must be based on an established child development framework (Piaget, Erikson, Vygotsky)
- No suggestions that require purchasing materials
- No suggestions that require adult supervision unless clearly stated
- Age ranges must be conservative — if in doubt, narrow the range
- Each suggestion must include `eriksonTheme` and `piagetConcept` for the psychology engine to tag it correctly
- All content PRs must include a statement from the contributor confirming the suggestion is age-appropriate

Use branch prefix `content/suggestions-<ageband>`, e.g., `content/suggestions-age7-11`.

---

*KidChronicle · CONTRIBUTING.md · May 2026 · kiren-labs*
