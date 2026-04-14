import { program } from "./lib/cli.js";
import * as ui from "./ui.js";
import { readIgnoreFile, saveIgnorePatterns, formatSize } from "./utils.js";
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
 * Run the ReclaimSpace CLI: parse arguments, scan target directories, and launch the UI.
 *
 * Reads package metadata for CLI info, resolves and validates search paths, merges ignore/include
 * patterns, performs a scan with progress reporting, and starts the interactive or non-interactive UI.
 * Registers a one-time SIGINT handler that prints total reclaimed space and exits.
 *
 * @param {string} baseDir - Project root used as the default directory to scan when none are provided.
 */
async function run(baseDir) {
  const state = { totalReclaimed: 0 };
  const pkg = JSON.parse(await fs.readFile(new URL("../package.json", import.meta.url), "utf8"));

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
    .name("reclaimspace")
    .version(pkg.version)
    .description(pkg.description)
    .argument("[dirs...]", "Directories to scan")
    .option("-y, --yes", "Auto-delete all found items without confirmation")
    .option("-d, --dry", "Preview only, do not delete anything")
    .option("-u, --ui", "Enable interactive UI to select what to delete")
    .option("-i, --ignore <patterns>", "Comma-separated list of patterns to ignore")
    .option(
      "-s, --save-ignore <patterns>",
      "Permanently ignore patterns by saving them to .reclaimspacerc",
    )
    .option("-c, --include <patterns>", "Comma-separated list of patterns to include")
    .option("-b, --build-analysis", "Enable build analysis logs")
    .parse(process.argv);

  const options = program.opts();
  let searchPaths = program.args.length ? program.args : [baseDir];

  if (typeof options.saveIgnore === "string") {
    const patternsToSave = options.saveIgnore.split(",").filter(Boolean);
    if (patternsToSave.length > 0) {
      await saveIgnorePatterns(baseDir, patternsToSave);
      console.log(
        chalk.green(
          `Successfully saved ignore patterns to .reclaimspacerc: ${patternsToSave.join(", ")}`,
        ),
      );
    }
  }

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
