import { config } from "../../config/index.js";
import { buildClient, withRetry, politeDelay } from "../utils/http.js";
import { log } from "../utils/logger.js";

const client = buildClient(config.ocean.baseUrl, {
  "x-api-token": config.ocean.apiKey,
});

export async function findLookalikes(seedDomain) {
  log.stage(1, "Ocean.io — Finding lookalike companies");
  log.info(`Seed domain: ${seedDomain}`);

  const response = await withRetry(
    () =>
      client.post("/search/companies", {
        size: config.pipeline.maxLookalikes,
        companiesFilters: {
          lookalikeDomains: [seedDomain],
        },
      }),
    3,
    "Ocean.io /v3/search/companies",
  );

  const companies = (response.data?.companies ?? []).map((item) => item.company ?? item);

  if (companies.length === 0) {
    log.warn("Ocean.io returned 0 lookalikes. Check your domain or API key.");
    return [];
  }

  log.success(`Found ${companies.length} lookalike companies:`);
  companies.forEach((c) =>
    log.dim(
      `  • ${c.name ?? c.domain}  (${c.industry ?? "unknown industry"}, ~${c.employee_count ?? "?"} employees)`,
    ),
  );

  await politeDelay();

  return companies.map((c) => ({
    domain: c.domain,
    name: c.name ?? c.domain,
    industry: c.industry ?? "",
    size: c.employee_count ?? null,
  }));
}
