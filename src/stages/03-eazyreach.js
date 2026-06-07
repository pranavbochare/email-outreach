import { config } from "../../config/index.js";
import { buildClient, withRetry, politeDelay } from "../utils/http.js";
import { log } from "../utils/logger.js";

const client = buildClient(config.eazyreach.baseUrl, {
  Authorization: `Bearer ${config.eazyreach.apiKey}`,
});

export async function resolveEmails(contacts) {
  log.stage(3, "Eazyreach — Resolving work emails from LinkedIn");

  const resolved = [];
  const failed = [];

  for (const contact of contacts) {
    if (!contact.linkedinUrl) {
      log.warn(`  No LinkedIn URL for ${contact.name} — skipping`);
      failed.push(contact);
      continue;
    }

    log.info(`Resolving email for ${contact.name} (${contact.company})…`);

    try {
      const response = await withRetry(
        () =>
          client.post("/email-finder", {
            linkedin_url: contact.linkedinUrl,
          }),
        3,
        `Eazyreach:${contact.name}`,
      );

      const { email, confidence, status } = response.data ?? {};

      if (!email || status === "invalid") {
        log.warn(`  No valid email for ${contact.name} — dropping`);
        failed.push(contact);
      } else {
        const confidenceLabel =
          confidence >= 0.9 ? "✓ high" : confidence >= 0.7 ? "~ medium" : "? low";
        log.dim(`  ${contact.name} → ${email}  [confidence: ${confidenceLabel}]`);
        resolved.push({ ...contact, email, emailConfidence: confidence, emailStatus: status });
      }
    } catch (err) {
      log.error(`  Eazyreach failed for ${contact.name}: ${err.message} — skipping`);
      failed.push(contact);
    }

    await politeDelay();
  }

  log.success(`Emails resolved: ${resolved.length}  |  Dropped: ${failed.length}`);
  return resolved;
}
