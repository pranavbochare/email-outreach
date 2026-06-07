# Automated Outreach Pipeline

## One Input. Four Stages. Zero Human Touchpoints.

Type a domain. The pipeline does the rest — finding lookalike companies, surfacing decision-makers, resolving verified work emails, and sending personalized outreach automatically.

---

# Architecture

```text
company.domain
      │
      ▼
┌─────────────────────┐
│ Stage 1 · Ocean.io │
│ Seed domain → lookalike company domains
└──────────┬──────────┘
           │
           ▼
[{ domain, name, industry, size }]

┌──────────────────────┐
│ Stage 2 · Prospeo    │
│ Domains → C-suite/VP contacts + LinkedIn URLs
└──────────┬───────────┘
           │
           ▼
[{ name, title, linkedinUrl, company, ... }]

┌───────────────────────┐
│ Stage 3 · Eazyreach   │
│ LinkedIn URLs → verified work emails
│ (currently handled by Prospeo)
└──────────┬────────────┘
           │
           ▼
[{ ...contact, email, confidence }]

┌──────────────────────────┐
│ ⚠ Safety Checkpoint      │
│ Human reviews summary    │
│ Confirms before sending  │
└──────────┬───────────────┘
           │
           ▼
confirmed

┌───────────────────────┐
│ Stage 4 · Brevo       │
│ Personalized outreach │
└───────────────────────┘
           │
           ▼
reports
```

---

# Concept

Every stage's output becomes the next stage's input.

No manual copy-paste.

No spreadsheets.

One command runs the entire workflow.

---

# Quick Start

## Create Company Email

* Purchase a domain using Namecheap
* Configure email routing using Cloudflare

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and provide the required API keys.

| Variable             | Where to get it                                                         |
| -------------------- | ----------------------------------------------------------------------- |
| `OCEAN_API_KEY`      | ocean.io → Settings → API                                               |
| `PROSPEO_API_KEY`    | app.prospeo.io/api                                                      |
| `EAZYREACH_API_KEY`  | eazyreach.app → API *(currently not used but added for future support)* |
| `BREVO_API_KEY`      | app.brevo.com → Settings → API Keys                                     |
| `BREVO_SENDER_EMAIL` | Verified sender email configured in Brevo                               |

---

## 3. Run the Pipeline

### Interactive Mode

```bash
node src/index.js
```

### Pass Domain Directly

```bash
node src/index.js stripe.com
```

### Dry Run

Simulates the complete workflow without sending emails.

```bash
DRY_RUN=true node src/index.js stripe.com
```

---

# Project Structure

```text
vocallabs-outreach/
├── src/
│   ├── index.js
│   │   └── Orchestrator / entry point
│   │
│   ├── stages/
│   │   ├── 01-ocean.js
│   │   │   └── Stage 1: Lookalike discovery
│   │   │
│   │   ├── 02-prospeo.js
│   │   │   └── Stage 2: Decision-maker search
│   │   │
│   │   ├── 03-eazyreach.js
│   │   │   └── Stage 3: Email resolution
│   │   │      (currently handled by Prospeo)
│   │   │
│   │   └── 04-brevo.js
│   │       └── Stage 4: Outreach delivery
│   │
│   └── utils/
│       ├── logger.js
│       │   └── Pretty terminal output
│       │
│       ├── http.js
│       │   └── Retry logic + rate-limit handling
│       │
│       ├── emailCopy.js
│       │   └── Personalized email generation
│       │
│       ├── checkpoint.js
│       │   └── Pre-send safety review
│       │
│       └── report.js
│           └── JSON run report generation
│
├── config/
│   └── index.js
│       └── Environment validation + config
│
├── reports/
│   └── Auto-created timestamped reports
│
├── .env.example
├── package.json
└── README.md
```

---

# Why One Stage = One File?

Each stage is independently testable and easily replaceable.

For example:

* If Ocean.io changes its API, only `01-ocean.js` needs updating.
* If you decide to replace Prospeo with Apollo, only `02-prospeo.js` changes.
* The rest of the pipeline remains untouched.

This keeps the system modular, maintainable, and scalable.

---

# Resilience to Messy Data

The pipeline is designed to continue operating even when individual records fail.

### Handled Automatically

* Missing LinkedIn URLs → contact skipped
* Invalid or undeliverable emails → removed before send stage
* Single-company failure in Stage 2 or Stage 3 → logged and skipped
* Duplicate LinkedIn profiles → automatically de-duplicated

The pipeline never crashes because of a single bad record.

---

# Safety Checkpoint

Before any email is sent:

1. The pipeline pauses.
2. A table is displayed showing:

   * Name
   * Title
   * Company
   * Email
   * Confidence Score
3. The user explicitly confirms the send.

For testing:

```bash
DRY_RUN=true
```

runs the entire workflow without sending emails.

---

# Email Personalization

`src/utils/emailCopy.js` generates contact-specific outreach.

### Personalization Signals

* First name extracted automatically
* Title-aware messaging

  * CEO / Founder messaging differs from VP messaging
* Industry-specific context included in email body
* Subject line rotation

### Subject Rotation

Five deterministic subject variations are used per company to reduce pattern-based spam detection.

---

# Reports

Every run generates a timestamped JSON report inside `reports/`.

The report includes:

* Recipients
* Email addresses
* Message IDs
* Successes
* Failures
* Execution summary

Useful for follow-ups, auditing, and troubleshooting.

---

# Configuration Reference

All configuration is managed through `.env`.

| Variable                   | Default | Description                         |
| -------------------------- | ------- | ----------------------------------- |
| `MAX_LOOKALIKES`           | `10`    | Companies returned by Ocean.io      |
| `MAX_CONTACTS_PER_COMPANY` | `3`     | Decision-makers fetched per company |
| `RATE_LIMIT_DELAY_MS`      | `1000`  | Delay between API calls             |
| `DRY_RUN`                  | `false` | Skip email delivery when enabled    |

---

# Edge Cases Handled

| Scenario                          | Behaviour                          |
| --------------------------------- | ---------------------------------- |
| Ocean.io returns 0 results        | Pipeline exits with clear error    |
| Company has no decision-makers    | Logged and skipped                 |
| LinkedIn URL missing              | Contact dropped before enrichment  |
| Email marked invalid by Eazyreach | Contact dropped before send        |
| Brevo send fails for one contact  | Logged, remaining emails continue  |
| API rate limit (429)              | Respects Retry-After and retries   |
| Network timeout                   | 3 retries with exponential backoff |
| Duplicate LinkedIn profiles       | Automatically de-duplicated        |

---

# Future Improvements

* Use AI to generate more personalized email copy.
* Improve throughput for handling larger company and contact volumes.
* Add a UI for:

  * Entering target companies
  * Reviewing recipients
  * Viewing historical outreach activity
  * Managing reports instead of relying solely on Brevo
* Add campaign analytics and reply tracking.
* Support additional enrichment providers (Apollo, Clay, etc.).
