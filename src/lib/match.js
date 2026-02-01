/**
 * Simple glob-to-regex converter for basics
 */
export function minimatch(str, pattern) {
  if (pattern === "*") return true;
  if (!pattern) return false;

  // Convert glob to regex
  const regexStr = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "(.+)")
    .replace(/\*/g, "([^/]+)")
    .replace(/\?/g, "(.)");

  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(str);
}

export default { minimatch };
