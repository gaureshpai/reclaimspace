import { minimatch } from "../src/lib/match.js";

describe("minimatch", () => {
  it("should match basic strings", () => {
    expect(minimatch("foo", "foo")).toBe(true);
    expect(minimatch("foo", "bar")).toBe(false);
  });

  it("should handle * correctly", () => {
    expect(minimatch("foo", "*")).toBe(true);
    expect(minimatch("foo.js", "*.js")).toBe(true);
    expect(minimatch("path/to/foo.js", "*.js")).toBe(false); // * shouldn't match across slashes
    expect(minimatch("foo.js", "foo.*")).toBe(true);
    expect(minimatch("foo.js.bak", "foo.*")).toBe(true);
  });

  it("should handle ** correctly", () => {
    expect(minimatch("path/to/foo.js", "**/foo.js")).toBe(true);
    expect(minimatch("a/b/c/d", "a/**/d")).toBe(true);
    expect(minimatch("a/d", "a/**/d")).toBe(true);
    expect(minimatch("a/b/c", "a/**")).toBe(true);
  });

  it("should handle ? correctly", () => {
    expect(minimatch("foo", "f?o")).toBe(true);
    expect(minimatch("foo", "f??")).toBe(true);
    expect(minimatch("foo", "f?")).toBe(false);
  });

  it("should handle matchBase option", () => {
    expect(minimatch("path/to/foo.js", "foo.js", { matchBase: true })).toBe(true);
    expect(minimatch("path/to/foo.js", "*.js", { matchBase: true })).toBe(true);
    expect(minimatch("path/to/foo.js", "to/foo.js", { matchBase: true })).toBe(false); // Only basename
  });

  it("should escape regex metacharacters", () => {
    expect(minimatch("foo.js", "foo.js")).toBe(true);
    expect(minimatch("foo+bar", "foo+bar")).toBe(true);
    expect(minimatch("foo(bar)", "foo(bar)")).toBe(true);
    expect(minimatch("foo[bar]", "foo[bar]")).toBe(true);
  });

  it("should return false for empty pattern", () => {
    expect(minimatch("foo", "")).toBe(false);
    expect(minimatch("foo", null)).toBe(false);
    expect(minimatch("foo", undefined)).toBe(false);
  });
});
