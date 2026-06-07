import { config } from "../../config/index.js";
import { buildClient, withRetry, politeDelay } from "../utils/http.js";
import { generateEmail } from "../utils/emailCopy.js";
import { log } from "../utils/logger.js";

const client = buildClient(config.brevo.baseUrl, {
  "api-key": config.brevo.apiKey,
});

export async function sendOutreach(contacts) {
  console.log("🔥🔥🔥🔥🔥🔥 sendOutreach ---------> ", contacts);
  log.stage(4, "Brevo — Sending personalized outreach emails");

  if (config.pipeline.dryRun) {
    log.warn("DRY RUN mode — emails will NOT be sent. Set DRY_RUN=false to fire live.");
  }

  const results = { sent: [], failed: [] };

  for (const contact of contacts) {
    console.log("🔥🔥🔥🔥🔥🔥 contact individual ---------> ", contact);
    const { subject, body } = generateEmail(contact);

    console.log("🔥🔥🔥🔥🔥 subject---------> ", subject);
    console.log("🔥🔥🔥🔥🔥 body ----------> ", body);

    log.info(`Sending to ${contact.name} <${contact.email.email}> @ ${contact.company}…`);
    log.dim(`  Subject: "${subject}"`);

    if (config.pipeline.dryRun) {
      log.dim("  [DRY RUN] Skipped actual send.");
      results.sent.push({ ...contact, subject, dryRun: true });
      continue;
    }

    try {
      const response = await withRetry(
        () =>
          client.post("/smtp/email", {
            sender: {
              name: config.brevo.senderName,
              email: config.brevo.senderEmail,
            },
            to: [{ email: contact.email.email, name: contact.name }],
            subject,
            textContent: body,
            tags: ["vocallabs-outreach", contact.domain],
          }),
        3,
        `Brevo:${contact.email.email}`,
      );

      log.success(`  Sent! MessageId: ${response.data?.messageId}`);
      results.sent.push({ ...contact, subject, messageId: response.data?.messageId });
    } catch (err) {
      const detail = err?.response?.data?.message ?? err.message;
      log.error(`  Failed to send to ${contact.email.email}: ${detail}`);
      results.failed.push({ ...contact, error: detail });
    }

    await politeDelay();
  }

  return results;
}
