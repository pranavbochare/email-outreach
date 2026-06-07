import inquirer from "inquirer";
import chalk from "chalk";
import { table } from "table";
import { log } from "./logger.js";

export async function safetyCheckpoint(contacts, dryRun) {
  log.blank();
  console.log(chalk.bold.yellow("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.bold.yellow("  ⚠  SAFETY CHECKPOINT — Review before sending  "));
  console.log(chalk.bold.yellow("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  log.blank();

  if (contacts.length === 0) {
    log.warn("No contacts to send to. Pipeline will exit.");
    return false;
  }

  // Build summary table
  const rows = [
    [
      chalk.bold("Name"),
      chalk.bold("Title"),
      chalk.bold("Company"),
      chalk.bold("Email"),
      chalk.bold("Confidence"),
    ],
    ...contacts.map((c) => [
      c.name,
      c.title || "—",
      c.company,
      c.email.email,
      confidenceBadge(c.emailConfidence),
    ]),
  ];

  console.log(
    table(rows, {
      border: {
        topBody: "─",
        topJoin: "┬",
        topLeft: "╭",
        topRight: "╮",
        bottomBody: "─",
        bottomJoin: "┴",
        bottomLeft: "╰",
        bottomRight: "╯",
        bodyLeft: "│",
        bodyRight: "│",
        bodyJoin: "│",
        joinBody: "─",
        joinLeft: "├",
        joinRight: "┤",
        joinJoin: "┼",
      },
    }),
  );

  console.log(chalk.bold(`  Total emails to fire: ${chalk.cyan(contacts.length)}`));
  if (dryRun) {
    console.log(chalk.yellow("  Mode: DRY RUN — nothing will actually be sent"));
  } else {
    console.log(chalk.red("  Mode: LIVE — real emails will be delivered"));
  }
  log.blank();

  const { confirmed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message: dryRun
        ? "Proceed with dry-run simulation?"
        : chalk.red("Confirm sending these emails? This cannot be undone."),
      default: false,
    },
  ]);

  if (!confirmed) {
    log.warn("Aborted by user at safety checkpoint.");
  }

  return confirmed;
}

function confidenceBadge(score) {
  if (!score) return chalk.gray("—");
  if (score >= 0.9) return chalk.green(`${Math.round(score * 100)}%`);
  if (score >= 0.7) return chalk.yellow(`${Math.round(score * 100)}%`);
  return chalk.red(`${Math.round(score * 100)}%`);
}
