# SECURITY.md — KidChronicle

## Security and privacy model

KidChronicle's security model is based on a single design decision: **no data ever leaves the parent's device during normal use**.

There is no server to breach. There is no account to compromise. There is no cloud backup to intercept.

---

## What data is stored and where

| Data | Storage location | Accessible to |
|---|---|---|
| Family name | `localStorage` (`kc_family`) | Parent's browser on parent's device only |
| Child profiles (name, date of birth, avatar) | `localStorage` (`kc_children`) | Parent's browser on parent's device only |
| App settings | `localStorage` (`kc_settings`) | Parent's browser on parent's device only |
| Child log entries | `IndexedDB` (`logEntries`) | Parent's browser on parent's device only |
| Points events | `IndexedDB` (`pointsEvents`) | Parent's browser on parent's device only |
| Parent reflections | `IndexedDB` (`parentReflections`) | Parent's browser on parent's device only |

**No data is transmitted to any server at any time during normal use.**

The only network call made by the app is the initial asset fetch from GitHub Pages when the app is first opened. After that, the service worker serves all assets from the local cache.

---

## What network calls the app makes

| When | What is fetched | Why |
|---|---|---|
| First load | `index.html`, `css/*.css`, `js/*.js`, `assets/**` | Load the app |
| Service worker install | Same asset list | Cache for offline use |
| After first load | **Nothing** | All assets served from cache |

To verify: open Chrome DevTools → Network tab → reload the app with the service worker active. You will see zero requests to any external domain.

---

## Children's data — legal considerations

KidChronicle stores date of birth and names of children under 13. In some jurisdictions this triggers obligations:

| Regulation | Applicability | How KidChronicle complies |
|---|---|---|
| COPPA (US) | Applies to services collecting data from children under 13 | All data is stored locally on the parent's device. No server collects, processes, or transmits child data. |
| GDPR-K (EU) | Applies to processing personal data of children | No data leaves the device. The app is a local tool, not an online service processing personal data. |
| UK GDPR | Same as EU GDPR | Same as above |

**This is not legal advice.** If you are distributing this app in a commercial context, consult a lawyer.

---

## Parent reflection privacy

Parent reflection entries are isolated from child data at the storage layer:

- Stored in a separate IndexedDB object store (`parentReflections`)
- `reflection.js` never imports from `logbook.js`
- Child profile screens have no code path to `parentReflections`
- JSON export clearly separates `childLogEntries` from `parentReflections`

A child shown their own profile by a parent will never see parent reflection entries, regardless of the parent's browser state, because the child profile code does not query that store.

---

## QR sync security (v1.1)

The QR-based co-parent sync in v1.1 transmits data between two devices on the same physical network or line-of-sight (one phone shows a QR code, the other scans it).

| Risk | Mitigation |
|---|---|
| QR code intercepted visually | Data visible on-screen only — same risk as showing your phone screen to someone |
| Malformed JSON injection | `validateSchema()` validates all fields and types before any write |
| Overwriting newer data | Import is merge-only — no existing entries are overwritten |

The QR sync does not use a server relay. No data transits any network infrastructure.

---

## Reporting a vulnerability

If you find a security vulnerability in KidChronicle, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Report vulnerabilities to:

```
Security contact: [OPEN — add your email here]
Subject line:     [SECURITY] KidChronicle — <short description>
```

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact (what data could be exposed, to whom)
- Your suggested fix if you have one

We will acknowledge receipt within 48 hours and aim to ship a fix within 7 days for critical issues.

---

## Supported versions

| Version | Security fixes |
|---|---|
| v1.1.x (latest) | ✅ Supported |
| v1.0.x | ⚠️ Critical fixes only |
| < v1.0 | ❌ Not supported |

---

## Third-party code

| Component | Source | What it does |
|---|---|---|
| Tabler Icons | `cdnjs.cloudflare.com` (CSS font) | UI icons — loaded on first page load, cached by service worker |
| Google Fonts (Fraunces, DM Sans) | `fonts.googleapis.com` | Typography — loaded on first page load, cached by service worker |
| qrcode.js (v1.1) | `cdnjs.cloudflare.com` | QR code generation for sync — no data sent to CDN |
| jsQR (v1.1) | `cdnjs.cloudflare.com` | QR code scanning — processes camera frames locally |

All third-party libraries are loaded from the CDN **on first load only** and cached locally by the service worker. After first load, they are served from cache with no CDN call.

No third-party library has access to user data.

---

*KidChronicle · SECURITY.md · May 2026 · kiren-labs*
