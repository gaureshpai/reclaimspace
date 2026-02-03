import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fastFolderSize } from "./lib/fs-utils.js";
import chalk from "./lib/ansi.js";
import { CATEGORIES, FOLDER_CATEGORIES, BUILD_ARTIFACT_PATTERNS } from "./constants.js";
import { minimatch } from "./lib/match.js";

const fastFolderSizeAsync = promisify(fastFolderSize);

const CONCURRENCY_LIMIT = 5;

/**
 * Detects build artifact filename patterns present in a folder.
 * @param {string} folderPath - Path of the folder to inspect.
 * @returns {Promise<Array<string>>} Detected build artifact patterns found in the folder.
 */
async function getBuildPatterns(folderPath) {
  const detectedPatterns = [];
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    for (const pattern of BUILD_ARTIFACT_PATTERNS) {
      if (pattern.includes("*")) {
        const regexStr = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");
        const regex = new RegExp(`^${regexStr}$`);
        if (entries.some((entry) => regex.test(entry.name))) {
          detectedPatterns.push(pattern);
        }
      } else {
        if (entries.some((entry) => entry.name === pattern)) {
          detectedPatterns.push(pattern);
        }
      }
    }
  } catch (err) {
    console.error(chalk.red(`Error checking build artifacts in ${folderPath}: ${err.message}`));
  }
  return detectedPatterns;
}

/**
 * Scan the given root paths for reclaimable directories and collect their sizes and metadata.
 *
 * @param {Array<string>} searchPaths - Root directories to scan.
 * @param {Array<string>} ignorePatterns - Glob patterns used to exclude paths from scanning.
 * @param {Object} onProgress - Progress bar instance with `start`, `increment`, and `stop` methods for tracking scan progress.
 * @param {Object} spinner - Spinner instance with `text` property and `stop` method for displaying status updates.
 * @param {Array<string>} [includePatterns] - Optional custom folder name patterns to treat as categories instead of the default folder categories.
 * @returns {Promise<{targets: Array<{path: string, size: number, category: string, name: string, lastModified: Date, buildPatterns: Array<string>}>, totalSize: number, duration: number}>}
 *   An object containing:
 *   - `targets`: sorted list of discovered directories with metadata: `path`, `size` (bytes), `category` id, `name`, `lastModified` timestamp, and `buildPatterns` (detected build artifact patterns, if any).
 *   - `totalSize`: aggregate size in bytes of all reported targets.
 *   - `duration`: elapsed scanning time in seconds.
 */
async function find(searchPaths, ignorePatterns, onProgress, spinner, includePatterns) {
  const startTime = process.hrtime.bigint();

  const targets = [];
  let totalSize = 0;
  const visited = new Set();

  const allPotentialDirs = [];

  const currentFolderCategories =
    includePatterns && includePatterns.length > 0
      ? [{ id: "custom", names: includePatterns }]
      : FOLDER_CATEGORIES;

  /**
   * Collects candidate directories beneath a starting path that match the configured folder categories and appends them to the shared collection.
   *
   * Skips paths already visited and those matching ignorePatterns; when a subdirectory's name matches any name in currentFolderCategories it is added to allPotentialDirs, otherwise recursion continues into that subdirectory except for directories named "node_modules". Permission errors (EPERM) are ignored; other errors are logged to stderr.
   * @param {string} currentPath - Filesystem path to start scanning from.
   */
  async function collectDirs(currentPath) {
    if (visited.has(currentPath)) return;
    visited.add(currentPath);

    if (
      ignorePatterns.some((pattern) => {
        try {
          const normalizedPath = currentPath.replace(/\\/g, "/");
          return minimatch(normalizedPath, pattern, { matchBase: true });
        } catch (_e) {
          return false;
        }
      })
    ) {
      return;
    }

    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          let isMatch = false;
          for (const cat of currentFolderCategories) {
            if (cat.names.some((name) => minimatch(entry.name, name))) {
              isMatch = true;
              break;
            }
          }

          if (isMatch) {
            allPotentialDirs.push({ path: fullPath, entry });
          } else {
            if (entry.name !== "node_modules") {
              await collectDirs(fullPath);
            }
          }
        }
      }
    } catch (err) {
      if (err.code !== "EPERM") {
        console.error(chalk.red(`Error collecting directories in ${currentPath}: ${err.message}`));
      }
    }
  }

  for (const searchPath of searchPaths) {
    await collectDirs(searchPath);
  }

  spinner.stop();

  async function processDir(fullPath, entry) {
    spinner.text = chalk.bold.blue(`Scanning: ${fullPath}`);

    if (visited.has(fullPath)) {
      return;
    }
    visited.add(fullPath);

    if (
      ignorePatterns.some((pattern) => {
        try {
          const normalizedPath = fullPath.replace(/\\/g, "/");
          return minimatch(normalizedPath, pattern, { matchBase: true });
        } catch (_e) {
          return false;
        }
      })
    ) {
      return;
    }

    if (entry.isDirectory()) {
      let category = null;
      for (const cat of currentFolderCategories) {
        if (cat.names.some((name) => minimatch(entry.name, name))) {
          category = cat.id;
          break;
        }
      }

      if (category) {
        let detectedBuildPatterns = [];
        if (category === "build") {
          detectedBuildPatterns = await getBuildPatterns(fullPath);
        }

        try {
          const size = await fastFolderSizeAsync(fullPath);
          if (size > 0) {
            const stats = await fs.stat(fullPath);
            targets.push({
              path: fullPath,
              size,
              category,
              name: entry.name,
              lastModified: stats.mtime,
              buildPatterns: detectedBuildPatterns,
            });
            totalSize += size;
          }
        } catch (err) {
          if (err.code !== "EPERM") {
            console.error(chalk.red(`Error calculating size for ${fullPath}: ${err.message}`));
          }
        }
      }
    }
  }

  const queue = [...allPotentialDirs];
  const activePromises = new Set();

  visited.clear();

  onProgress.start(allPotentialDirs.length, 0);

  while (queue.length > 0 || activePromises.size > 0) {
    while (queue.length > 0 && activePromises.size < CONCURRENCY_LIMIT) {
      const dirInfo = queue.shift();
      const promise = processDir(dirInfo.path, dirInfo.entry).finally(() => {
        activePromises.delete(promise);
        onProgress.increment();
      });
      activePromises.add(promise);
    }
    if (activePromises.size > 0) {
      await Promise.race(activePromises);
    } else if (queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  onProgress.stop();

  targets.sort((a, b) => {
    const categoryA = CATEGORIES.find((c) => c.id === a.category);
    const categoryB = CATEGORIES.find((c) => c.id === b.category);

    const orderA = categoryA ? categoryA.order : 99;
    const orderB = categoryB ? categoryB.order : 99;

    if (orderA !== orderB) return orderA - orderB;
    return b.size - a.size;
  });

  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1_000_000_000;

  return { targets, totalSize, duration };
}

export { find };
