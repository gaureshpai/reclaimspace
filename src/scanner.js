import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fastFolderSize } from "./lib/fs-utils.js";
import chalk from "./lib/ansi.js";
import { CATEGORIES, FOLDER_CATEGORIES, BUILD_ARTIFACT_PATTERNS } from "./constants.js";
import { minimatch } from "./lib/match.js";

const fastFolderSizeAsync = promisify(fastFolderSize);

const CONCURRENCY_LIMIT = 5;

const regexCache = new Map();

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
        let regex = regexCache.get(pattern);
        if (!regex) {
          const regexStr = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");
          regex = new RegExp(`^${regexStr}$`, "i");
          regexCache.set(pattern, regex);
        }
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
 * Scan root directories for reclaimable folders and collect their sizes and metadata.
 *
 * Recursively searches the provided searchPaths for directories whose names match the configured folder categories (or the optional includePatterns), excludes paths matching ignorePatterns, computes folder sizes, detects build artifact patterns for build folders, and returns sorted targets with aggregate size and elapsed scanning time.
 *
 * @param {Array<string>} searchPaths - Root directories to scan.
 * @param {Array<string>} ignorePatterns - Glob patterns used to exclude paths from scanning.
 * @param {Object} onProgress - Progress tracker implementing `start(total, current)`, `increment()`, and `stop()` to report scan progress.
 * @param {Object} spinner - Spinner/UI object with a mutable `text` property and a `stop()` method used for status updates.
 * @param {Array<string>} [includePatterns] - Optional custom folder name patterns to treat as categories instead of the default folder categories.
 * @returns {{targets: Array<{path: string, size: number, category: string, name: string, lastModified: Date, buildPatterns: Array<string>}>, totalSize: number, duration: number}} An object containing:
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
          let category = null;
          for (const cat of currentFolderCategories) {
            if (cat.names.some((name) => minimatch(entry.name, name))) {
              category = cat.id;
              break;
            }
          }

          if (category) {
            allPotentialDirs.push({ path: fullPath, entry, category });
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

  /**
   * Collect metadata and disk usage for a directory candidate when it matches a configured folder category.
   *
   * Records a target entry with path, size, category id, directory name, last modified time, and any detected
   * build artifact patterns (for the "build" category), and adds the folder size to the running total.
   *
   * @param {string} fullPath - Full filesystem path of the directory candidate.
   * @param {import("node:fs").Dirent} entry - Directory entry corresponding to the candidate.
   * @param {string} category - The matched category id.
   */
  async function processDir(fullPath, entry, category) {
    spinner.text = chalk.bold.blue(`Scanning: ${fullPath}`);

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

  const queue = [...allPotentialDirs];
  const activePromises = new Set();

  onProgress.start(allPotentialDirs.length, 0);

  while (queue.length > 0 || activePromises.size > 0) {
    while (queue.length > 0 && activePromises.size < CONCURRENCY_LIMIT) {
      const dirInfo = queue.shift();
      const promise = processDir(dirInfo.path, dirInfo.entry, dirInfo.category).finally(() => {
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
