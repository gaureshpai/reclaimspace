import fs from "node:fs/promises";
import path from "node:path";

/**
 * Recursively get the size of a folder
 */
export async function getFolderSize(directory) {
  let totalSize = 0;
  try {
    const files = await fs.readdir(directory, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(directory, file.name);
      if (file.isDirectory()) {
        totalSize += await getFolderSize(fullPath);
      } else if (file.isFile()) {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  } catch (err) {
    if (err.code === "ENOENT" || err.code === "EACCES") {
      // Expected errors, ignore silently
    } else {
      console.debug(`Unexpected error processing ${directory}: ${err.message}`);
    }
  }
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
        continue;
      }
      throw err;
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
