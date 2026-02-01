import path from "node:path";

/**
 * Simple glob-to-regex converter and matcher.
 * Supports **, *, and ?.
 * @param {string} str - String to test.
 * @param {string} pattern - Glob pattern.
 * @param {Object} [options] - Optional settings.
 * @param {boolean} [options.matchBase] - If true, match against basename of path if pattern has no slashes.
 * @returns {boolean} True if the string matches the pattern.
 */
export function minimatch(str, pattern, options = {}) {
  if (!pattern) return false;

  let target = str;
  if (options.matchBase && !pattern.includes("/")) {
    target = path.basename(str);
  }

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

  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(target);
}

export default { minimatch };
