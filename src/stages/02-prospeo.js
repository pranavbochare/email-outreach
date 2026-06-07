import { config } from "../../config/index.js";
import { buildClient, withRetry, politeDelay } from "../utils/http.js";
import { log } from "../utils/logger.js";

const client = buildClient(config.prospeo.baseUrl, {
  "X-KEY": config.prospeo.apiKey,
});

const TARGET_LEVELS = ["Founder/Owner", "Director", "Partner"];

export async function findDecisionMakers(companies) {
  log.stage(2, "Prospeo — Finding decision-makers");

  const allContacts = [];

  for (const company of companies) {
    log.info(`Scanning ${company.domain}…`);

    try {
      const response = await withRetry(
        () =>
          client.post("/search-person", {
            page: 1,
            filters: {
              company: {
                websites: {
                  include: [company.domain],
                },
              },
              person_seniority: {
                include: TARGET_LEVELS,
              },
            },
          }),
        3,
        `Prospeo:${company.domain}`,
      );

      if (!response || !response.data) {
        throw new Error("Invalid response from Prospeo: missing data");
      }

      if (response.data?.error) {
        throw new Error(response.data?.error_code || "Unknown Prospeo error");
      }

      let contacts = response.data?.results ?? [];
      if (contacts.length > config.pipeline.maxContactsPerCompany) {
        contacts = contacts.slice(0, config.pipeline.maxContactsPerCompany);
      }

      if (contacts.length === 0) {
        log.warn(`  No decision-makers found for ${company.domain} — skipping`);
      } else {
        contacts.forEach((result) => {
          const person = result.person ?? {};
          const title = person.current_job_title ?? person.title ?? "";
          const fullName =
            person.full_name ?? `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
          const firstName = fullName?.split(" ")[0] ?? "there";
          const email = person.email ?? person.personal_email ?? person.work_email ?? null;
          const syntheticEmail = email || `${firstName.toLowerCase()}.${company.domain}`;
          log.dim(`  ✓ ${fullName || "Unknown"} — ${title}`);
          allContacts.push({
            name: fullName || "Unknown",
            firstName,
            title,
            linkedinUrl: person.linkedin_url ?? person.linkedinUrl,
            email: syntheticEmail,
            emailConfidence: email ? 0.95 : 0.5,
            company: company.name,
            domain: company.domain,
            industry: company.industry,
            size: company.size,
          });
        });
      }
    } catch (err) {
      const status = err?.response?.status;
      const errorMsg = err?.message || "Unknown error";
      const details = err?.response?.data ? ` ${JSON.stringify(err.response.data)}` : "";
      const statusText = status ? ` (HTTP ${status})` : "";
      log.error(`  Failed for ${company.domain}: ${errorMsg}${statusText}${details} — continuing`);
    }

    await politeDelay();
  }

  log.success(`Total decision-makers found: ${allContacts.length}`);

  const seen = new Set();
  const unique = allContacts.filter((c) => {
    if (!c.linkedinUrl || seen.has(c.linkedinUrl)) return false;
    seen.add(c.linkedinUrl);
    return true;
  });

  if (unique.length < allContacts.length) {
    log.dim(`Removed ${allContacts.length - unique.length} duplicate profiles.`);
  }

  return unique;
}
