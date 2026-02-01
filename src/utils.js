import fs from "node:fs/promises";
import path from "node:path";

/**
 * Formats bytes into a human-readable string (e.g., "1.23 MB").
 * @param {number} bytes - The number of bytes to format.
 * @returns {string} Human-readable size string.
 */
function formatSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Reads ignore patterns from .reclaimspacerc and appends default system ignores.
 * @param {string} baseDir - The directory to look for .reclaimspacerc in.
 * @returns {Promise<Array<string>>} List of glob patterns to ignore.
 */
async function readIgnoreFile(baseDir) {
  const ignoreFilePath = path.join(baseDir, ".reclaimspacerc");
  let patterns = [];
  try {
    const content = await fs.readFile(ignoreFilePath, "utf-8");
    patterns = content.split(/\r?\n/).filter((line) => line && !line.startsWith("#"));
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }

  patterns.push("/Program Files");
  patterns.push("/Program Files (x86)");

  patterns.push("/Applications");
  patterns.push("/System");
  patterns.push("/Library");

  patterns.push("/usr");
  patterns.push("/var");
  patterns.push("/etc");
  patterns.push("/opt");

  patterns.push("/.vscode");
  patterns.push("/.cursor");
  patterns.push("/.idea");
  patterns.push("/.sublime-project");
  patterns.push("/.sublime-workspace");
  patterns.push("/.atom");
  patterns.push("/.project");
  patterns.push("/.classpath");
  patterns.push("/.settings");
  patterns.push("/nbproject");
  patterns.push("/.editorconfig");

  patterns.push("src");
  patterns.push("source");
  patterns.push("app");
  patterns.push("lib");
  patterns.push("components");
  patterns.push("pages");
  patterns.push("styles");
  patterns.push("assets");

  return patterns;
}

/**
 * Formats a Date object or timestamp into YYYY-MM-DD.
 * @param {Date|number|string} date - The date to format.
 * @returns {string} Formatted date string.
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `0${d.getMonth() + 1}`.slice(-2);
  const day = `0${d.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
}

export { formatSize, readIgnoreFile, formatDate };
