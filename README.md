### Automated Outreach Pipeline

# Working -> One input. Four stages. Zero human touchpoints

> Type a domain. The pipeline does the rest — finding lookalikes, surfacing decision-makers, resolving verified emails, and firing personalized outreach — automatically.

# Architecture

    company.domain
          │
          ▼
┌─────────────────────┐
│ Stage 1 · Ocean.io │ seed domain → lookalike company domains
└──────────┬──────────┘
│ [{ domain, name, industry, size }]
▼
┌──────────────────────┐
│ Stage 2 · Prospeo │ domains → C-suite/VP contacts + LinkedIn URLs
└──────────┬───────────┘
│ [{ name, title, linkedinUrl, company, ... }]
▼
┌───────────────────────┐
│ Stage 3 · Eazyreach │ LinkedIn URLs → verified work emails -> done by prospeo
└──────────┬────────────┘
│ [{ ...contact, email, confidence }]
▼
┌──────────────────────────┐
│ ⚠ Safety Checkpoint │ human reviews summary, confirms send
└──────────┬───────────────┘
│ confirmed
▼
┌───────────────────────┐
│ Stage 4 · Brevo │ sends personalized cold email per contact
└───────────────────────┘
│
▼
reports

# concept

Every stage's output is the next stage's input. No manual copy-paste. No spreadsheets. One command runs the whole chain.

# Quick Start

# create company email

- using namecheap for domain name
- using cloudflare for email routing

# 1. Install dependencies

```bash
npm install
```

# 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your API keys:

| Variable             | Where to get it                                              |
| -------------------- | ------------------------------------------------------------ | 
| `OCEAN_API_KEY`      | [ocean.io](https://ocean.io) → Settings → API                |
| `PROSPEO_API_KEY`    | [app.prospeo.io/api](https://app.prospeo.io/api)             |
| `EAZYREACH_API_KEY`  | [eazyreach.app](https://eazyreach.app) → API                 | -> not in use but added 
| `BREVO_API_KEY`      | [app.brevo.com](https://app.brevo.com) → Settings → API Keys |
| `BREVO_SENDER_EMAIL` | Your verified sender email in Brevo                          |

# 3. Run the pipeline

```bash
# Interactive (will prompt for domain)
node src/index.js

# Pass domain directly
node src/index.js stripe.com

# Dry run — simulates everything, skips actual sending
DRY_RUN=true node src/index.js stripe.com

# Project Structure

vocallabs-outreach/
├── src/
│   ├── index.js                  ← orchestrator / entry point
│   ├── stages/
│   │   ├── 01-ocean.js           ← Stage 1: lookalike discovery
│   │   ├── 02-prospeo.js         ← Stage 2: decision-maker search
│   │   ├── 03-eazyreach.js       ← Stage 3: email resolution   -> done buy prospeo
│   │   └── 04-brevo.js           ← Stage 4: outreach delivery
│   └── utils/
│       ├── logger.js             ← pretty terminal output
│       ├── http.js               ← retry logic + rate-limit handling
│       ├── emailCopy.js          ← personalized email generator
│       ├── checkpoint.js         ← pre-send safety review
│       └── report.js             ← JSON run report
├── config/
│   └── index.js                  ← env validation + config object
├── reports/                      ← auto-created, one JSON per run
├── .env.example
├── package.json
└── README.md

# Why one stage = one file?

- Each stage is independently testable and swappable. If Ocean.io's API changes or you want to replace Prospeo with Apollo, you touch exactly one file.

# Resilience to messy data

- Missing LinkedIn URLs → contact skipped, rest of pipeline continues
- Invalid/undeliverable emails → dropped before the send stage
- Any single-company failure in Stage 2/3 → logged and skipped; pipeline doesn't crash
- Duplicate LinkedIn profiles → de-duplicated before email resolution

# Safety checkpoint

- Before any email fires, the pipeline pauses and displays a table of every recipient (name, title, company, email, confidence score). The user must explicitly confirm. Set `DRY_RUN=true` to simulate the full run without ever sending.

# Email personalization

`src/utils/emailCopy.js` generates copy that's specific to each contact:

- **First name** extracted from full name
- **Title-aware hook** (CEO/Founder gets different framing than VP)
- **Industry context** woven into the body
- **Subject line rotation** (5 variants, deterministically chosen per company) to avoid pattern-based spam flags

### Reports

Every run writes a timestamped JSON to `reports/` with the full summary — what was sent, to whom, message IDs, and any failures. Useful for follow-up tracking.

## Configuration Reference

All options live in `.env`:

| Variable                   | Default | Description                        |
| -------------------------- | ------- | ---------------------------------- |
| `MAX_LOOKALIKES`           | `10`    | Companies returned by Ocean.io     |
| `MAX_CONTACTS_PER_COMPANY` | `3`     | Decision-makers fetched per domain |
| `RATE_LIMIT_DELAY_MS`      | `1000`  | ms pause between API calls         |
| `DRY_RUN`                  | `false` | Skip actual email send when `true` |


## Edge Cases Handled

| Scenario                          | Behaviour                                   |
| --------------------------------- | ------------------------------------------- |
| Ocean.io returns 0 results        | Pipeline exits early with clear error       |
| Company has no decision-makers    | Logged, skipped — other companies continue  |
| LinkedIn URL missing              | Contact dropped at Stage 3                  |
| Email marked invalid by Eazyreach | Contact dropped before send                 |
| Brevo send fails for one contact  | Logged to report, rest of sends continue    |
| API rate limit (429)              | Respects Retry-After, retries automatically |
| Network timeout                   | 3 retries with back-off, then error logged  |
| Duplicate LinkedIn profiles       | De-duplicated after Stage 2                 |

# Improvements

- can take help of AI to write personalized emails.
- if we want to handle maximum companies and contacts then efficient code structure.
- we can add ui to enter company name and show all history of emails send instead of brevo.
