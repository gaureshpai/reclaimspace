import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import chalk from "./lib/ansi.js";
import { formatSize } from "./utils.js";

const execAsync = promisify(exec);

/**
 * @typedef {Object} CacheCleaner
 * @property {string} name - Display name of the package manager.
 * @property {string} command - The cache clean command to run.
 * @property {string} [cacheDir] - Optional path to the cache directory for size estimation.
 * @property {boolean} available - Whether the package manager is installed and accessible.
 */

/**
 * Detect which package managers are available on the system.
 * @returns {Promise<Array<{name: string, command: string, cacheDir?: string, available: boolean}>>}
 */
async function detectPackageManagers() {
  const home = os.homedir();
  const platform = process.platform;
  const localAppData =
    process.env.LOCALAPPDATA || (platform === "win32" ? path.join(home, "AppData", "Local") : "");

  /**
   * Get the platform-specific cache directory for a package manager.
   * @param {string} name - Package manager name.
   * @returns {string|null}
   */
  const getCacheDir = (name) => {
    switch (name) {
      case "npm":
        return platform === "win32"
          ? path.join(localAppData, "npm-cache")
          : path.join(home, ".npm");
      case "pnpm":
        if (platform === "win32") {
          return path.join(localAppData, "pnpm", "store");
        }
        if (platform === "darwin") {
          return path.join(home, "Library", "Caches", "pnpm");
        }
        return path.join(home, ".local", "share", "pnpm", "store");
      case "yarn":
        if (platform === "win32") {
          return path.join(localAppData, "Yarn", "Cache");
        }
        if (platform === "darwin") {
          return path.join(home, "Library", "Caches", "yarn");
        }
        return path.join(home, ".cache", "yarn");
      case "pip":
        if (platform === "win32") {
          return path.join(localAppData, "pip", "Cache");
        }
        if (platform === "darwin") {
          return path.join(home, "Library", "Caches", "pip");
        }
        return path.join(home, ".cache", "pip");
      default:
        return null;
    }
  };

  const managers = [
    {
      name: "npm",
      command: "npm cache clean --force",
      cacheDir: getCacheDir("npm"),
    },
    {
      name: "pnpm",
      command: "pnpm store prune",
      cacheDir: getCacheDir("pnpm"),
    },
    {
      name: "yarn",
      command: "yarn cache clean",
      cacheDir: getCacheDir("yarn"),
    },
    {
      name: "pip",
      command: "pip cache purge",
      cacheDir: getCacheDir("pip"),
    },
  ];

  const results = await Promise.all(
    managers.map(async (mgr) => {
      try {
        const { stdout } = await execAsync(`${mgr.name} --version`, {
          timeout: 5000,
        });
        const version = stdout.trim();
        return { ...mgr, available: true, version };
      } catch {
        return { ...mgr, available: false };
      }
    }),
  );

  return results;
}

/**
 * Estimate the size of a cache directory in bytes.
 * Returns 0 if the directory does not exist or is inaccessible.
 * @param {string} dirPath - Path to the cache directory.
 * @returns {Promise<number>} Size in bytes.
 */
async function estimateCacheSize(dirPath) {
  try {
    await fs.access(dirPath);
    // Use a simple recursive size calculation
    let totalSize = 0;

    async function calculate(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await calculate(fullPath);
          } else if (entry.isFile()) {
            try {
              const stats = await fs.stat(fullPath);
              totalSize += stats.size;
            } catch {
              // Ignore individual file stat errors
            }
          }
        }
      } catch {
        // Skip inaccessible directories
      }
    }

    await calculate(dirPath);
    return totalSize;
  } catch {
    return 0;
  }
}

/**
 * Run the deep clean process: detect available package managers, estimate cache sizes,
 * and execute cache clean commands.
 *
 * @param {Object} [options]
 * @param {boolean} [options.dry=false] - If true, only report what would be cleaned without deleting.
 * @param {(message: string) => void} [options.onMessage] - Callback for status messages.
 * @returns {Promise<{cleaned: Array<{name: string, beforeSize: number, afterSize: number, success: boolean, output?: string}>, totalCleaned: number}>}
 */
async function runDeepClean(options = {}) {
  const { dry = false, onMessage } = options;
  const log = onMessage || ((msg) => process.stdout.write(msg));

  const managers = await detectPackageManagers();

  /** @type {Array<{name: string, beforeSize: number, afterSize: number, success: boolean, output?: string}>} */
  const results = [];

  let totalCleaned = 0;

  for (const mgr of managers) {
    if (!mgr.available) {
      log(chalk.dim(`  - ${mgr.name}: not found, skipping\n`));
      continue;
    }

    log(chalk.bold(`  ${chalk.cyan(mgr.name)} (v${mgr.version})\n`));

    // Estimate before size
    const beforeSize = mgr.cacheDir ? await estimateCacheSize(mgr.cacheDir) : 0;

    if (dry) {
      log(chalk.yellow(`    Cache size: ${formatSize(beforeSize)}\n`));
      log(chalk.dim(`    Would run: ${mgr.command}\n`));
      results.push({
        name: mgr.name,
        beforeSize,
        afterSize: beforeSize,
        success: true,
        output: "(dry run, no action taken)",
      });
      continue;
    }

    log(chalk.gray(`    Cache size: ${formatSize(beforeSize)}\n`));

    try {
      const { stdout, stderr } = await execAsync(mgr.command, {
        timeout: 30000,
        shell: process.platform === "win32" ? true : "/bin/sh",
      });
      const output = (stdout + stderr).trim();

      // Estimate after size
      const afterSize = mgr.cacheDir ? await estimateCacheSize(mgr.cacheDir) : 0;
      const freed = beforeSize - afterSize;

      if (freed > 0) {
        log(chalk.green(`    Freed: ${formatSize(freed)}\n`));
      } else if (beforeSize > 0) {
        log(chalk.yellow(`    Cleaned (size unchanged at ${formatSize(beforeSize)})\n`));
      } else {
        log(chalk.gray("    Cache was already empty\n"));
      }

      results.push({ name: mgr.name, beforeSize, afterSize, success: true, output });
      totalCleaned += freed;
    } catch (err) {
      log(chalk.red(`    Error: ${err.message}\n`));
      results.push({
        name: mgr.name,
        beforeSize,
        afterSize: beforeSize,
        success: false,
        output: err.message,
      });
    }
  }

  return { cleaned: results, totalCleaned };
}

export { detectPackageManagers, estimateCacheSize, runDeepClean };
