import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { log } from './logger.js';

export function writeReport({ seedDomain, companies, contacts, results }) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `outreach-report-${ts}.json`;
  const dir = join(process.cwd(), 'reports');

  mkdirSync(dir, { recursive: true });

  const report = {
    runAt: new Date().toISOString(),
    seedDomain,
    summary: {
      lookalikes: companies.length,
      contactsFound: contacts.length,
      emailsSent: results.sent.length,
      emailsFailed: results.failed.length,
    },
    sent: results.sent.map((c) => ({
      name: c.name,
      email: c.email,
      title: c.title,
      company: c.company,
      subject: c.subject,
      messageId: c.messageId ?? null,
      dryRun: c.dryRun ?? false,
    })),
    failed: results.failed,
  };

  writeFileSync(join(dir, filename), JSON.stringify(report, null, 2));
  log.success(`Report saved → ${chalk.underline(`reports/${filename}`)}`);
  return report;
}

export function printFinalSummary(report) {
  const { summary } = report;
  console.log(`
${chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.bold.white('  PIPELINE COMPLETE')}
${chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
  Seed domain   : ${chalk.cyan(report.seedDomain)}
  Lookalikes    : ${chalk.white(summary.lookalikes)}
  Contacts      : ${chalk.white(summary.contactsFound)}
  Emails sent   : ${chalk.green(summary.emailsSent)}
  Failures      : ${summary.emailsFailed > 0 ? chalk.red(summary.emailsFailed) : chalk.green(0)}
${chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
`);
}
