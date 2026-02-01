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
 * Main application runner. Initialized arguments, starts scan, and launches UI.
 * @param {string} baseDir - The root directory of the project.
 */
async function run(baseDir) {
  const state = { totalReclaimed: 0 };

  process.once("SIGINT", () => {
    process.stdout.write(
      chalk.green(`
Total space reclaimed: ${formatSize(state.totalReclaimed)}
`),
    );
    process.stdout.write(chalk.bold.white("Thank you for using ReclaimSpace!\n\n"));
    process.exit(130);
  });

  displayLogoAndCredits();

  program
    .argument("[dirs...]", "Directories to scan", [process.cwd()])
    .option("--yes", "Auto-delete all found items without confirmation")
    .option("--dry", "Preview only, do not delete anything")
    .option("--ui", "Enable interactive UI to select what to delete")
    .option("--ignore <patterns>", "Comma-separated list of patterns to ignore")
    .option("--include <patterns>", "Comma-separated list of patterns to include")
    .option("--build-analysis", "Enable build analysis logs")
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
    console.log(chalk.bold.white("Thanks for using ReclaimSpace!\n\n"));
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
}

export { run };
