import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import cliProgress from 'cli-progress';
import ora from 'ora';
import { formatSize, formatDate } from './utils.js';
import { deleteTarget } from './deleter.js';
import { CATEGORIES } from './constants.js';
import * as scanner from './scanner.js';

function truncatePath(p, maxLength = 50) {
  if (p.length <= maxLength) {
    return p;
  }
  const ellipsis = '...';
  const start = p.length - maxLength + ellipsis.length;
  return ellipsis + p.substring(start);
}

async function runScannerWithProgress(searchPaths, ignorePatterns) {
  const spinner = ora(chalk.bold.blue('Collecting directories...')).start();

  const progressBar = new cliProgress.SingleBar({
    format: chalk.blue(' {bar}') + ' | ' + chalk.yellow('{percentage}%') + ' | ' + chalk.green('{value}/{total}') + ' Folders',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);

  const results = await scanner.find(searchPaths, ignorePatterns, progressBar, spinner);

  console.log('\n');
  return results;
}

async function start({ targets, totalSize, duration, options, baseDir, state }) {
  if (!targets || targets.length === 0) {
    console.log(chalk.green('No reclaimable space found. Your workspace is clean! ✨'));
    console.log(chalk.gray(`Search completed in ${duration.toFixed(2)}s`));
    return;
  }

  console.log(chalk.cyan(`Releasable space: ${formatSize(totalSize)}`));
  console.log(chalk.green(`Space saved: ${formatSize(state.totalReclaimed)}`));
  console.log(chalk.gray(`Search completed ${duration.toFixed(2)}s`));
  console.log('\n');

  if (options.dry) {
    console.log(chalk.yellow('--dry run: No files will be deleted.'));
    displayTargets(targets, baseDir);
    console.log(chalk.cyan(`Total reclaimable space: ${formatSize(totalSize)}`));
    return;
  }

  if (options.yes) {
    console.log(chalk.yellow('--yes: Deleting all found items...'));
    for (const target of targets) {
      await handleDelete(target, state);
    }
    console.log(chalk.green(`Total space reclaimed: ${formatSize(state.totalReclaimed)}`));
    return;
  }

  await interactiveUI(targets, totalSize, baseDir, state);
}

function displayTargets(targets, baseDir) {
  console.log(chalk.bold.gray('  Size      Last Modified  Path'));
  console.log(chalk.bold.gray('  --------- --------------  ----'));
  for (const target of targets) {
    const relativePath = path.relative(baseDir, target.path);
    const size = formatSize(target.size).padEnd(9);
    const lastModified = formatDate(target.lastModified);
    console.log(`  ${chalk.cyan(size)} ${chalk.yellow(lastModified)}  ${chalk.white(relativePath)}`);
  }
}

async function interactiveUI(targets, totalSize, baseDir, state) {
  console.clear();
  console.log(chalk.cyan(`Releasable space: ${formatSize(totalSize)}`) + ` | ` + chalk.green(`Space saved: ${formatSize(state.totalReclaimed)}`));
  console.log('');

  console.log(chalk.bold.gray('  Size      Last Modified  Path'));
  console.log(chalk.bold.gray('  --------- --------------  ----'));

  const choices = targets.map(target => ({
    name: `${chalk.cyan(formatSize(target.size).padEnd(10))} ${chalk.yellow(formatDate(target.lastModified))}  ${chalk.white(path.relative(baseDir, target.path))}`,
    value: target,
  }));

  try {
    const { selectedTargets } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedTargets',
        message: 'Use space to select, a to toggle all, i to invert selection, and enter to proceed.',
        choices: [
          ...choices,
          new inquirer.Separator(),
        ],
        pageSize: 20,
      },
    ]);

    if (selectedTargets.length > 0) {
      for (const target of selectedTargets) {
        await handleDelete(target, state);
      }
    }
  } catch (error) {
    process.kill(process.pid, 'SIGINT');
  }

  console.log(chalk.green(`Total space reclaimed: ${formatSize(state.totalReclaimed)}`));
  console.log(chalk.bold.white('Thanks for using ReclaimSpace!'));
}

async function handleDelete(target, state) {
  process.stdout.write(`Deleting ${path.basename(target.path)}... `);
  const { success, error } = await deleteTarget(target.path);
  if (success) {
    state.totalReclaimed += target.size;
    process.stdout.write(chalk.green('Done!\n'));
    return true;
  }
  else {
    process.stdout.write(chalk.red(`Error: ${error.message}\n`));
    return false;
  }
}

export { start, runScannerWithProgress };