import inquirer from "./lib/prompt.js";
import chalk from "./lib/ansi.js";
import path from "node:path";
import cliProgress from "./lib/progress.js";
import ora from "./lib/spinner.js";
import { formatSize, formatDate } from "./utils.js";
import { deleteTarget } from "./deleter.js";
import * as scanner from "./scanner.js";

/**
 * Runs the directory scanner with a progress bar and spinner.
 * @param {Array<string>} searchPaths - Directories to scan.
 * @param {Array<string>} ignorePatterns - Glob patterns to ignore.
 * @param {Array<string>} includePatterns - Glob patterns to include (overrides default).
 * @returns {Promise<Object>} Scanner results containing targets, total size, and duration.
 */
async function runScannerWithProgress(searchPaths, ignorePatterns, includePatterns) {
  const spinner = ora(chalk.bold.blue("Collecting directories...")).start();

  const progressBar = new cliProgress.SingleBar(
    {
      format:
        chalk.blue(" {bar}") +
        " | " +
        chalk.yellow("{percentage}%") +
        " | " +
        chalk.green("{value}/{total}") +
        " Folders",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic,
  );

  const results = await scanner.find(
    searchPaths,
    ignorePatterns,
    progressBar,
    spinner,
    includePatterns,
  );

  console.log("\n");
  return results;
}

/**
 * Main UI entry point. Handles dry runs, auto-deletion, and interactive mode.
 * @param {Object} context - Application context containing targets, options, and state.
 */
async function start({ targets, totalSize, duration, options, baseDir, state, buildAnalysis }) {
  if (!targets || targets.length === 0) {
    console.log(chalk.green("No reclaimable space found. Your workspace is clean! \n\n"));
    console.log(chalk.gray(`Search completed in ${duration.toFixed(2)}s`));
    return;
  }

  console.log(chalk.cyan(`Releasable space: ${formatSize(totalSize)}`));
  console.log(chalk.gray(`Search completed in ${duration.toFixed(2)}s`));
  console.log("");

  if (options.buildAnalysis && buildAnalysis) {
    console.log(chalk.bold.blue("Build Analysis:"));
    if (Object.keys(buildAnalysis.inferredProjectTypes).length > 0) {
      console.log(chalk.blue("  Inferred Project Types:"));
      for (const type in buildAnalysis.inferredProjectTypes) {
        console.log(
          chalk.blue(`    - ${type}: ${buildAnalysis.inferredProjectTypes[type]} instances`),
        );
      }
    }
    if (buildAnalysis.commonPatterns.size > 0) {
      console.log(chalk.blue("  Common Build Patterns:"));
      for (const pattern of buildAnalysis.commonPatterns) {
        console.log(chalk.blue(`    - ${pattern}`));
      }
    }
    if (buildAnalysis.uniquePatterns.size > 0) {
      console.log(chalk.blue("  Unique Build Patterns:"));
      for (const pattern of buildAnalysis.uniquePatterns) {
        console.log(chalk.blue(`    - ${pattern}`));
      }
    }
    console.log("");
  }

  if (options.dry) {
    console.log(chalk.yellow("--dry run: No files will be deleted."));
    displayTargets(targets, baseDir);
    console.log(chalk.cyan(`Total reclaimable space: ${formatSize(totalSize)}`));
    process.stdout.write(chalk.bold.white("Thanks for using ReclaimSpace!\n\n"));
    return;
  }

  if (options.yes) {
    console.log(chalk.yellow("--yes: Deleting all found items..."));
    for (const target of targets) {
      await handleDelete(target, state);
    }
    console.log(chalk.green(`Total space reclaimed: ${formatSize(state.totalReclaimed)}`));
    process.stdout.write(chalk.bold.white("Thanks for using ReclaimSpace!\n\n"));
    return;
  }

  await interactiveUI(targets, totalSize, baseDir, state);
}

/**
 * Displays a list of targets in a formatted table.
 * @param {Array<Object>} targets - List of targets to display.
 * @param {string} baseDir - Base directory for relative path calculation.
 */
function displayTargets(targets, baseDir) {
  console.log(chalk.bold.gray("  Size      Last Modified  Path"));
  console.log(chalk.bold.gray("  --------- --------------  ----"));
  for (const target of targets) {
    const relativePath = path.relative(baseDir, target.path);
    const size = formatSize(target.size).padEnd(9);
    const lastModified = formatDate(target.lastModified);
    console.log(
      `  ${chalk.cyan(size)} ${chalk.yellow(lastModified)}  ${chalk.white(relativePath)}`,
    );
  }
}

/**
 * Launches the interactive checkbox UI for selecting items to delete.
 * @param {Array<Object>} targets - Reclaimable targets.
 * @param {number} _totalSize - Unused.
 * @param {string} baseDir - Base directory.
 * @param {Object} state - Application state.
 */
async function interactiveUI(targets, _totalSize, baseDir, state) {
  console.log("");

  console.log(
    chalk.dim("Use space to select, a to toggle all, i to invert selection, and enter to proceed."),
  );
  console.log(chalk.bold.gray("  Size      Last Modified  Path"));
  console.log(chalk.bold.gray("  --------- --------------  ----"));

  const choices = targets.map((target) => ({
    name: `${chalk.cyan(formatSize(target.size).padEnd(10))} ${chalk.yellow(formatDate(target.lastModified))}  ${chalk.white(path.relative(baseDir, target.path))}`,
    value: target,
  }));

  try {
    const { selectedTargets } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedTargets",
        message: "Select items for deletion:",
        choices: choices,
      },
    ]);

    if (selectedTargets.length > 0) {
      console.log(chalk.bold.white("\nSelected items for deletion:"));
      displayTargets(selectedTargets, baseDir);
      console.log("\n");

      for (const target of selectedTargets) {
        await handleDelete(target, state);
      }
    }
  } catch (_error) {
    process.kill(process.pid, "SIGINT");
  }

  console.log(chalk.green(`Total space reclaimed: ${formatSize(state.totalReclaimed)}`));
  console.log(chalk.bold.white("Thanks for using ReclaimSpace!\n\n"));
}

/**
 * Handles the deletion of a single target and updates the shared state.
 * @param {Object} target - Target to delete.
 * @param {Object} state - Application state to update.
 * @returns {Promise<boolean>} Success status.
 */
async function handleDelete(target, state) {
  process.stdout.write(`Deleting ${target.path}... `);
  const { success, error } = await deleteTarget(target.path);
  if (success) {
    state.totalReclaimed += target.size;
    process.stdout.write(chalk.green("Done!\n"));
    return true;
  } else {
    let msg = error.message;
    if (error.code === "EBUSY") {
      msg =
        "Resource busy or locked. Please close any applications (like IDEs or terminals) using this folder and try again.";
    }
    process.stdout.write(chalk.red(`Error: ${msg}\n`));
    return false;
  }
}

export { start, runScannerWithProgress };
