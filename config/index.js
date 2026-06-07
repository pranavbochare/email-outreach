import "dotenv/config";

const required = (key) => {
  const val = process.env[key];
  if (!val || val.startsWith("your_")) {
    throw new Error(
      `Missing required env var: ${key}\n` +
        `→ Copy .env.example to .env and fill in your API keys.`,
    );
  }
  return val;
};

const optional = (key, fallback) => process.env[key] ?? fallback;

export const config = {
  ocean: {
    apiKey: required("OCEAN_API_KEY"),
    baseUrl: "https://api.ocean.io/v3",
  },
  prospeo: {
    apiKey: required("PROSPEO_API_KEY"),
    baseUrl: "https://api.prospeo.io",
  },
  eazyreach: {
    apiKey: required("EAZYREACH_API_KEY"),
    baseUrl: "https://api.eazyreach.app/v1",
  },
  brevo: {
    apiKey: required("BREVO_API_KEY"),
    baseUrl: "https://api.brevo.com/v3",
    senderName: optional("BREVO_SENDER_NAME", "Outreach Bot"),
    senderEmail: required("BREVO_SENDER_EMAIL"),
  },
  pipeline: {
    maxLookalikes: parseInt(optional("MAX_LOOKALIKES", "10"), 10),
    maxContactsPerCompany: parseInt(optional("MAX_CONTACTS_PER_COMPANY", "3"), 10),
    rateLimitDelay: parseInt(optional("RATE_LIMIT_DELAY_MS", "1000"), 10),
    dryRun: optional("DRY_RUN", "false") === "true",
  },
};
