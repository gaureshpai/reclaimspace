import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

/**
 * Convert a byte count into a human-readable string using 1024-based units.
 *
 * The result is rounded to two decimal places and uses the units: Bytes, KB, MB, GB, TB.
 * For an input of 0 the function returns "0 Bytes".
 * @param {number} bytes - Number of bytes to format.
 * @returns {string} Formatted size string (e.g., "1.23 MB").
 */
function formatSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Compute the platform-specific global configuration directory for reclaimspace.
 *
 * On Windows, returns `%APPDATA%\reclaimspace` or `~\AppData\Roaming\reclaimspace` if APPDATA is unset.
 * On Linux/macOS, returns `$XDG_CONFIG_HOME/reclaimspace` when XDG_CONFIG_HOME is set, otherwise `~/.config/reclaimspace`.
 * @returns {string} Path to the global configuration directory for reclaimspace.
 */
function getGlobalConfigDir() {
  if (process.platform === "win32") {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      "reclaimspace",
    );
  }
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  if (xdgConfig) {
    return path.join(xdgConfig, "reclaimspace");
  }
  return path.join(os.homedir(), ".config", "reclaimspace");
}

/**
 * Read ignore patterns from a .reclaimspacerc file.
 *
 * Lines are trimmed, empty lines and lines starting with `#` are ignored,
 * and leading `/` characters are removed from each entry. If the file does not
 * exist, an empty array is returned; other I/O errors are propagated.
 * @param {string} filePath - Path to the .reclaimspacerc file.
 * @returns {Array<string>} Array of normalized pattern strings.
 */
async function readPatternsFromFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.replace(/^\/+/, ""));
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
    return [];
  }
}

/**
 * Reads ignore patterns from local .reclaimspacerc and global config, then appends default system ignores.
 * @param {string} baseDir - The directory to look for .reclaimspacerc in.
 * @returns {Promise<Array<string>>} List of glob patterns to ignore.
 */
async function readIgnoreFile(baseDir = process.cwd()) {
  // Read from both local and global config
  const [localPatterns, globalPatterns] = await Promise.all([
    readPatternsFromFile(path.join(baseDir, ".reclaimspacerc")),
    readPatternsFromFile(path.join(getGlobalConfigDir(), ".reclaimspacerc")),
  ]);

  // Merge patterns, deduplicating (local overrides take precedence, but we keep global ones too)
  const patternsSet = new Set([...globalPatterns, ...localPatterns]);
  const patterns = [...patternsSet];

  patterns.push("Program Files");
  patterns.push("Program Files (x86)");

  patterns.push("Applications");
  patterns.push("System");
  patterns.push("Library");

  patterns.push("usr");
  patterns.push("var");
  patterns.push("etc");
  patterns.push("opt");

  patterns.push(".vscode");
  patterns.push(".cursor");
  patterns.push(".idea");
  patterns.push(".sublime-project");
  patterns.push(".sublime-workspace");
  patterns.push(".atom");
  patterns.push(".project");
  patterns.push(".classpath");
  patterns.push(".settings");
  patterns.push("nbproject");
  patterns.push(".editorconfig");

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
 * Add new ignore patterns to the global .reclaimspacerc file.
 *
 * Normalizes each entry by trimming and removing leading slashes, ignores empty or commented lines,
 * and appends only patterns not already present in the global file. If no new patterns are added,
 * the function returns the target file path without modifying the file.
 * @param {Array<string>} patterns - Patterns to add to the global ignore file.
 * @returns {Promise<string>} The path to the global .reclaimspacerc file (written if new patterns were added).
 */
async function saveIgnorePatterns(patterns) {
  const globalDir = getGlobalConfigDir();
  const ignoreFilePath = path.join(globalDir, ".reclaimspacerc");

  // Ensure the global config directory exists
  await fs.mkdir(globalDir, { recursive: true });
  let existingContent = "";
  try {
    existingContent = await fs.readFile(ignoreFilePath, "utf-8");
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }

  const existingPatterns = existingContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.replace(/^\/+/, ""));

  const patternsToAdd = patterns
    .map((p) => p.trim().replace(/^\/+/, ""))
    .filter((p) => p && !existingPatterns.includes(p));

  if (patternsToAdd.length === 0) return ignoreFilePath;

  let finalContent = existingContent;
  if (finalContent && !finalContent.endsWith("\n")) {
    finalContent += "\n";
  }
  finalContent += `${patternsToAdd.join("\n")}\n`;

  await fs.writeFile(ignoreFilePath, finalContent, "utf-8");
  return ignoreFilePath;
}

/**
 * Format a date into YYYY-MM-DD.
 * @param {Date|number|string} date - A Date object, a millisecond timestamp, or a date-string parseable by Date.
 * @returns {string} The date formatted as `YYYY-MM-DD`.
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `0${d.getMonth() + 1}`.slice(-2);
  const day = `0${d.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
}

export { formatSize, readIgnoreFile, saveIgnorePatterns, formatDate, getGlobalConfigDir };
