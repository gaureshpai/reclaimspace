import fs from "node:fs/promises";
import path from "node:path";

/**
 * Recursively get the size of a folder with concurrency limit.
 */
export async function getFolderSize(directory) {
  let totalSize = 0;
  const CONCURRENCY_LIMIT = 20;

  async function calculate(dir) {
    let size = 0;
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const tasks = [];

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          tasks.push(calculate(fullPath));
        } else if (entry.isFile()) {
          tasks.push(
            fs.stat(fullPath).then((stats) => {
              size += stats.size;
            }),
          );
        }

        if (tasks.length >= CONCURRENCY_LIMIT) {
          const results = await Promise.all(tasks);
          for (const res of results) {
            if (typeof res === "number") size += res;
          }
          tasks.length = 0;
        }
      }

      if (tasks.length > 0) {
        const results = await Promise.all(tasks);
        for (const res of results) {
          if (typeof res === "number") size += res;
        }
      }
    } catch (err) {
      if (err.code !== "ENOENT" && err.code !== "EACCES" && err.code !== "EPERM") {
        console.debug(`Unexpected error processing ${dir}: ${err.message}`);
      }
    }
    return size;
  }

  totalSize = await calculate(directory);
  return totalSize;
}

/**
 * Remove a file or directory recursively with retry logic for Windows (EBUSY/EPERM)
 */
export async function removePath(targetPath, retries = 3, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      await fs.rm(targetPath, { recursive: true, force: true });
      return;
    } catch (err) {
      const isRetryable = err.code === "EBUSY" || err.code === "EPERM" || err.code === "ENOTEMPTY";
      if (isRetryable && i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Lightweight wrapper for getFolderSize matching the fast-folder-size API.
 * @param {string} dir - Directory to measure.
 * @param {Function} cb - Callback (err, size).
 */
export const fastFolderSize = (dir, cb) => {
  getFolderSize(dir)
    .then((size) => cb(null, size))
    .catch((err) => cb(err));
};
