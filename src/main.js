import { program } from "./lib/cli.js";
import * as ui from "./ui.js";
import { readIgnoreFile, formatSize } from "./utils.js";
import { analyzeBuildPatterns } from "./analyzer.js";
import chalk from "./lib/ansi.js";
import fs from "node:fs/promises";

/**
 * Displays the ReclaimSpace ASCII logo and initial credits.
 */
function displayLogoAndCredits() {
  const Logo = `
██████╗ ███████╗ ██████╗██╗      █████╗ ██╗███╗   ███╗
██╔══██╗██╔════╝██╔════╝██║     ██╔══██╗██║████╗ ████║
██████╔╝█████╗  ██║     ██║     ███████║██║██╔████╔██║
██╔══██╗██╔══╝  ██║     ██║     ██╔══██║██║██║╚██╔╝██║
██║  ██║███████╗╚██████╗███████╗██║  ██║██║██║ ╚═╝ ██║
╚═╝  ╚═╝╚══════╝ ╚═════╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝
`;
  console.log(chalk.cyan.bold(Logo));
}

/**
 * Start the ReclaimSpace CLI, perform a scan of target directories, and launch the UI.
 *
 * Parses command-line arguments and options, validates and resolves search paths, combines ignore
 * and include patterns, runs a scan with progress reporting, optionally performs build analysis,
 * and starts either the interactive or non-interactive UI. Registers a SIGINT handler that prints
 * the total reclaimed space and exits the process.
 *
 * @param {string} baseDir - Project root used as the default directory to scan when no paths are provided.
 */
async function run(baseDir) {
  const state = { totalReclaimed: 0 };
  const pkg = JSON.parse(await fs.readFile(new URL("../package.json", import.meta.url), "utf8"));

  let isExiting = false;
  process.on("SIGINT", () => {
    if (isExiting) return;
    isExiting = true;
    process.stdout.write(
      chalk.green(`
Total space reclaimed: ${formatSize(state.totalReclaimed)}
`),
    );
    process.stdout.write(chalk.bold.white("Thank you for using ReclaimSpace!\n\n"));
    process.exit(130);
  });

  process.stdin.resume();

  displayLogoAndCredits();

  program
    .name("reclaimspace")
    .version(pkg.version)
    .description(pkg.description)
    .argument("[dirs...]", "Directories to scan")
    .option("-y, --yes", "Auto-delete all found items without confirmation")
    .option("-d, --dry", "Preview only, do not delete anything")
    .option("-u, --ui", "Enable interactive UI to select what to delete")
    .option("-i, --ignore <patterns>", "Comma-separated list of patterns to ignore")
    .option("-c, --include <patterns>", "Comma-separated list of patterns to include")
    .option("-b, --build-analysis", "Enable build analysis logs")
    .parse(process.argv);

  const options = program.opts();
  let searchPaths = program.args.length ? program.args : [baseDir];

  if (!options.ui && !options.dry && !options.yes && program.args.length === 0) {
    options.ui = true;
  }

  const validSearchPaths = [];
  for (const p of searchPaths) {
    try {
      await fs.access(p);
      validSearchPaths.push(p);
    } catch (_error) {
      console.error(chalk.red(`Error: Path does not exist or is not accessible: ${p}`));
    }
  }

  if (validSearchPaths.length === 0) {
    console.log(chalk.yellow("No valid directories to scan. Exiting."));
    return;
  }
  searchPaths = validSearchPaths;

  const configIgnores = await readIgnoreFile(baseDir);
  const cliIgnores =
    typeof options.ignore === "string" ? options.ignore.split(",").filter(Boolean) : [];
  const ignorePatterns = [...configIgnores, ...cliIgnores];
  const includePatterns =
    typeof options.include === "string" ? options.include.split(",").filter(Boolean) : [];

  const { targets, totalSize, duration } = await ui.runScannerWithProgress(
    searchPaths,
    ignorePatterns,
    includePatterns,
  );

  if (!targets || targets.length === 0) {
    console.log(chalk.green("No reclaimable space found. Your workspace is clean!"));
    console.log(chalk.bold.white("Thank you for using ReclaimSpace!\n\n"));
    return;
  }

  const buildAnalysis = options.buildAnalysis ? analyzeBuildPatterns(targets) : null;

  await ui.start({
    targets,
    totalSize,
    duration,
    options,
    baseDir,
    state,
    buildAnalysis,
  });

  process.stdin.unref();
}

export { run };
