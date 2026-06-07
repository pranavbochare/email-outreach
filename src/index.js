import "dotenv/config";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";

import { config } from "../config/index.js";
import { banner, log } from "./utils/logger.js";
import { findLookalikes } from "./stages/01-ocean.js";
import { findDecisionMakers } from "./stages/02-prospeo.js";
import { sendOutreach } from "./stages/04-brevo.js";
import { safetyCheckpoint } from "./utils/checkpoint.js";
import { writeReport, printFinalSummary } from "./utils/report.js";

async function getSeedDomain() {
  const arg = process.argv[2];
  if (arg && arg.includes(".")) return arg.trim().toLowerCase();

  const { domain } = await inquirer.prompt([
    {
      type: "input",
      name: "domain",
      message: "Enter the seed company domain:",
      validate: (v) => v.includes(".") || "Please enter a valid domain (e.g. stripe.com)",
    },
  ]);
  return domain.trim().toLowerCase();
}

async function run() {
  banner();

  if (config.pipeline.dryRun) {
    console.log(chalk.bgYellow.black("  DRY RUN MODE — no emails will be sent  \n"));
  }

  try {
    void config; // config/index.js throws on missing required keys
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }

  const seedDomain = await getSeedDomain();
  log.blank();

  // ── Stage 1: Lookalike companies ──
  let companies;
  try {
    companies = await findLookalikes(seedDomain);
  } catch (err) {
    log.error(`Stage 1 failed: ${err.message}`);
    process.exit(1);
  }

  if (companies.length === 0) {
    log.error("No lookalike companies found. Cannot continue.");
    process.exit(1);
  }

  // ── Stage 2: Decision-makers ──
  let contacts;
  try {
    contacts = await findDecisionMakers(companies);
  } catch (err) {
    log.error(`Stage 2 failed: ${err.message}`);
    process.exit(1);
  }

  if (contacts.length === 0) {
    log.error("No decision-makers found across all companies. Cannot continue.");
    process.exit(1);
  }

  // ── Stage 3: Email resolution (SKIPPED by eazyreach — using Prospeo email data) ──
  const resolved = contacts; // Use Prospeo contacts directly as resolved
  log.stage(3, "Email resolution — using Prospeo data (Eazyreach unavailable)");
  log.success(`Email data ready: ${resolved.length} contacts`);

  if (resolved.length === 0) {
    log.error("No contacts with email data. Cannot continue.");
    process.exit(1);
  }

  // ── Safety checkpoint ──
  const proceed = await safetyCheckpoint(resolved, config.pipeline.dryRun);
  if (!proceed) {
    log.warn("Pipeline aborted. No emails sent.");
    process.exit(0);
  }

  // ── Stage 4: Send emails ──
  let results;
  try {
    results = await sendOutreach(resolved);
  } catch (err) {
    log.error(`Stage 4 failed: ${err.message}`);
    process.exit(1);
  }

  const report = writeReport({ seedDomain, companies, contacts: resolved, results });
  printFinalSummary(report);
}

run().catch((err) => {
  console.error(chalk.red("\nUnexpected fatal error:"), err);
  process.exit(1);
});
