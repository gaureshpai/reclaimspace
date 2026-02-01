import { analyzeBuildPatterns } from "../src/analyzer.js";

describe("analyzer", () => {
  it("should infer project types based on build patterns", () => {
    const targets = [
      { category: "build", buildPatterns: ["angular.json", "package.json"] },
      { category: "build", buildPatterns: ["next.config.js"] },
      { category: "node_modules", buildPatterns: ["package.json"] }, // Only build category counts
    ];

    const result = analyzeBuildPatterns(targets);
    expect(result.inferredProjectTypes.angular).toBe(1);
    expect(result.inferredProjectTypes.nextjs).toBe(1);
    expect(result.inferredProjectTypes.javascript).toBeUndefined(); // Covered by angular
  });

  it("should identify common and unique patterns", () => {
    const targets = [
      { category: "build", buildPatterns: ["common.js", "unique1.js"] },
      { category: "build", buildPatterns: ["common.js", "unique2.js"] },
    ];

    const result = analyzeBuildPatterns(targets);
    expect(result.commonPatterns.has("common.js")).toBe(true);
    expect(result.commonPatterns.has("unique1.js")).toBe(false);
    expect(result.uniquePatterns.has("unique1.js")).toBe(true);
    expect(result.uniquePatterns.has("unique2.js")).toBe(true);
  });

  it("should handle empty targets", () => {
    const result = analyzeBuildPatterns([]);
    expect(result.inferredProjectTypes).toEqual({});
    expect(result.commonPatterns.size).toBe(0);
    expect(result.uniquePatterns.size).toBe(0);
  });
});
