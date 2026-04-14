import path from "node:path";

const CACHE = new Map();

/**
 * Simple glob-to-regex converter and matcher.
 * Supports **, *, and ?.
 * @param {string} str - String to test.
 * @param {string} pattern - Glob pattern.
 * @param {Object} [options] - Optional settings.
 * @param {boolean} [options.matchBase] - If true, match against basename of path if pattern has no slashes.
 * @param {boolean} [options.nocase] - If true, match is case-insensitive.
 * @returns {boolean} True if the string matches the pattern.
 */
export function minimatch(str, pattern, options = {}) {
  if (!pattern) return false;

  const nocase = options.nocase ?? true; // Default to case-insensitive for CLI usage

  let target = str;
  if (options.matchBase && !pattern.includes("/")) {
    target = path.basename(str);
  }

  const cacheKey = `${pattern}:${options.matchBase}:${nocase}`;
  let regex = CACHE.get(cacheKey);

  if (!regex) {
    // Escape regex metacharacters: \ ^ $ . | ? * + ( ) [ ] { }
    const escaped = pattern.replace(/[\\^$.|?*+()[\]{}]/g, "\\$&");

    // Translate glob tokens back to regex patterns
    const regexStr = escaped
      .replace(/\/\\\*\\\*\//g, "/(?:.*/)?") // mid-path **
      .replace(/\/\\\*\\\*$/g, "(?:/.*)?") // trailing **
      .replace(/^\\\*\\\*\//g, "(?:.*/)?") // leading **
      .replace(/\\\*\\\*/g, ".*") // any other **
      .replace(/\\\*/g, "[^/]*")
      .replace(/\\\?/g, "[^/]");

    regex = new RegExp(`^${regexStr}$`, nocase ? "i" : "");
    CACHE.set(cacheKey, regex);
  }

  return regex.test(target);
}

export default { minimatch };
