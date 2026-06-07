import chalk from 'chalk';

const timestamp = () => new Date().toLocaleTimeString('en-US', { hour12: false });

export const log = {
  info:    (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.cyan('ℹ')}  ${msg}`),
  success: (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.green('✓')}  ${msg}`),
  warn:    (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.yellow('⚠')}  ${chalk.yellow(msg)}`),
  error:   (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.red('✗')}  ${chalk.red(msg)}`),
  stage:   (n, name) => console.log(`\n${chalk.bold.white(`STAGE ${n}`)} ${chalk.bold.cyan(`→ ${name}`)}\n${'─'.repeat(50)}`),
  dim:     (msg) => console.log(`         ${chalk.gray(msg)}`),
  blank:   () => console.log(''),
};

export const banner = () => {
  console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════════╗
║       VOCALLABS  ·  OUTREACH  PIPELINE           ║
║       Seed domain → Emails fired, hands-free     ║
╚══════════════════════════════════════════════════╝`));
};
