import { runDeepClean } from "../src/deep-cleaner.js";

// Mock child_process so we can control exec behavior without running real commands.
// jest.mock is hoisted before imports, so promisify(exec) will wrap the mock.
jest.mock("node:child_process", () => ({
  exec: jest.fn(),
}));

// Mock fs/promises so estimateCacheSize can be controlled without real filesystem.
// Use auto-mock (no factory) to match how other tests in this project mock node modules,
// ensuring babel's _interopRequireDefault wiring is handled consistently.
jest.mock("node:fs/promises");

import { exec } from "node:child_process";
import fs from "node:fs/promises";

/**
 * Helper: make exec.mockImplementation behave like the Node callback-based exec.
 * `responses` is a map from command prefix → { stdout, stderr } | Error.
 */
function setupExecMock(responses) {
  exec.mockImplementation((cmd, opts, callback) => {
    // Find matching entry
    const match = Object.entries(responses).find(([key]) => cmd.startsWith(key));
    if (!match) {
      callback(new Error(`Unexpected command: ${cmd}`));
      return;
    }
    const [, result] = match;
    if (result instanceof Error) {
      callback(result);
    } else {
      callback(null, result);
    }
  });
}

describe("runDeepClean", () => {
  let messages;
  let onMessage;

  beforeEach(() => {
    jest.clearAllMocks();
    messages = [];
    onMessage = (msg) => messages.push(msg);

    // Default: fs.access rejects (cache dirs don't exist → size = 0)
    fs.access.mockRejectedValue(new Error("ENOENT"));
    fs.readdir.mockResolvedValue([]);
    fs.stat.mockResolvedValue({ size: 0 });
  });

  describe("dry mode", () => {
    it("should return results without running clean commands", async () => {
      // npm and pnpm available, yarn and pip not found
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": { stdout: "8.0.0\n", stderr: "" },
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
      });

      const result = await runDeepClean({ dry: true, onMessage });

      expect(result).toHaveProperty("cleaned");
      expect(result).toHaveProperty("totalCleaned");
      // Only available managers should appear in cleaned results
      expect(result.cleaned.length).toBeGreaterThanOrEqual(1);
    });

    it("should set afterSize equal to beforeSize in dry mode", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
      });

      const result = await runDeepClean({ dry: true, onMessage });

      const npmResult = result.cleaned.find((r) => r.name === "npm");
      expect(npmResult).toBeDefined();
      expect(npmResult.beforeSize).toBe(npmResult.afterSize);
    });

    it("should set output to dry run message in dry mode", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
      });

      const result = await runDeepClean({ dry: true, onMessage });

      const npmResult = result.cleaned.find((r) => r.name === "npm");
      expect(npmResult.output).toBe("(dry run, no action taken)");
    });

    it("should mark dry run results as success", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
      });

      const result = await runDeepClean({ dry: true, onMessage });

      for (const entry of result.cleaned) {
        expect(entry.success).toBe(true);
      }
    });

    it("should not call clean commands in dry mode", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
      });

      await runDeepClean({ dry: true, onMessage });

      // exec is called for --version checks but NOT for cache clean commands
      const execCalls = exec.mock.calls.map(([cmd]) => cmd);
      expect(execCalls.some((cmd) => cmd.includes("cache clean"))).toBe(false);
      expect(execCalls.some((cmd) => cmd.includes("cache delete"))).toBe(false);
    });

    it("should return totalCleaned of 0 in dry mode (no actual cleaning)", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": { stdout: "8.0.0\n", stderr: "" },
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
      });

      const result = await runDeepClean({ dry: true, onMessage });

      // In dry mode, beforeSize === afterSize so freed = 0, totalCleaned = 0
      expect(result.totalCleaned).toBe(0);
    });
  });

  describe("real clean mode", () => {
    it("should execute cache clean commands for available managers", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
        "npm cache clean --force": { stdout: "", stderr: "" },
      });

      await runDeepClean({ dry: false, onMessage });

      const execCalls = exec.mock.calls.map(([cmd]) => cmd);
      expect(execCalls).toContain("npm cache clean --force");
    });

    it("should record success=true when clean command succeeds", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
        "npm cache clean --force": { stdout: "Cache cleaned\n", stderr: "" },
      });

      const result = await runDeepClean({ dry: false, onMessage });

      const npmResult = result.cleaned.find((r) => r.name === "npm");
      expect(npmResult).toBeDefined();
      expect(npmResult.success).toBe(true);
    });

    it("should record success=false and error message when clean command fails", async () => {
      const errorMsg = "Permission denied";
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
        "npm cache clean": new Error(errorMsg),
      });

      const result = await runDeepClean({ dry: false, onMessage });

      const npmResult = result.cleaned.find((r) => r.name === "npm");
      expect(npmResult).toBeDefined();
      expect(npmResult.success).toBe(false);
      expect(npmResult.output).toBe(errorMsg);
    });

    it("should set afterSize equal to beforeSize when clean command fails", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
        "npm cache clean": new Error("EPERM: operation not permitted"),
      });

      const result = await runDeepClean({ dry: false, onMessage });

      const npmResult = result.cleaned.find((r) => r.name === "npm");
      expect(npmResult.beforeSize).toBe(npmResult.afterSize);
    });

    it("should include combined stdout and stderr as output on success", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
        "npm cache clean --force": { stdout: "Cache cleared", stderr: "some warning" },
      });

      const result = await runDeepClean({ dry: false, onMessage });

      const npmResult = result.cleaned.find((r) => r.name === "npm");
      expect(npmResult.output).toBe("Cache clearedsome warning");
    });

    it("should skip unavailable managers and not include them in results", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
        "npm cache clean --force": { stdout: "", stderr: "" },
      });

      const result = await runDeepClean({ dry: false, onMessage });

      const names = result.cleaned.map((r) => r.name);
      expect(names).toContain("npm");
      expect(names).not.toContain("pnpm");
      expect(names).not.toContain("yarn");
      expect(names).not.toContain("pip");
    });

    it("should process multiple available managers", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": { stdout: "8.0.0\n", stderr: "" },
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
        "npm cache clean --force": { stdout: "", stderr: "" },
        "pnpm cache delete": { stdout: "", stderr: "" },
      });

      const result = await runDeepClean({ dry: false, onMessage });

      const names = result.cleaned.map((r) => r.name);
      expect(names).toContain("npm");
      expect(names).toContain("pnpm");
    });

    it("should continue processing remaining managers after one fails", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": { stdout: "8.0.0\n", stderr: "" },
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
        "npm cache clean": new Error("npm clean failed"),
        "pnpm cache delete": { stdout: "", stderr: "" },
      });

      const result = await runDeepClean({ dry: false, onMessage });

      // Both npm and pnpm should be in results
      const names = result.cleaned.map((r) => r.name);
      expect(names).toContain("npm");
      expect(names).toContain("pnpm");

      const npmResult = result.cleaned.find((r) => r.name === "npm");
      const pnpmResult = result.cleaned.find((r) => r.name === "pnpm");
      expect(npmResult.success).toBe(false);
      expect(pnpmResult.success).toBe(true);
    });

    it("should accumulate freed space in totalCleaned when before > after", async () => {
      // Set up fs mock so cacheDir has a "before" size of 1000 bytes
      // After clean, returns 0 bytes (cleaned successfully)
      fs.access.mockResolvedValue(undefined); // dir exists
      let callCount = 0;
      fs.readdir.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) {
          // First call (before): one file of 1000 bytes
          return Promise.resolve([
            { name: "cached-file", isFile: () => true, isDirectory: () => false },
          ]);
        }
        // Second call (after): empty
        return Promise.resolve([]);
      });
      fs.stat.mockResolvedValue({ size: 1000 });

      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
        "npm cache clean --force": { stdout: "", stderr: "" },
      });

      const result = await runDeepClean({ dry: false, onMessage });

      // Should have cleaned 1000 bytes
      expect(result.totalCleaned).toBe(1000);
    });
  });

  describe("all managers unavailable", () => {
    it("should return empty cleaned array when no managers are available", async () => {
      setupExecMock({
        "npm --version": new Error("not found"),
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
      });

      const result = await runDeepClean({ dry: false, onMessage });

      expect(result.cleaned).toEqual([]);
      expect(result.totalCleaned).toBe(0);
    });

    it("should return totalCleaned of 0 when no managers are available", async () => {
      setupExecMock({
        "npm --version": new Error("not found"),
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
      });

      const result = await runDeepClean({ dry: false, onMessage });

      expect(result.totalCleaned).toBe(0);
    });
  });

  describe("onMessage callback", () => {
    it("should call onMessage for available managers", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
        "npm cache clean --force": { stdout: "", stderr: "" },
      });

      await runDeepClean({ dry: false, onMessage });

      expect(messages.length).toBeGreaterThan(0);
    });

    it("should mention unavailable managers in messages", async () => {
      setupExecMock({
        "npm --version": new Error("not found"),
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
      });

      await runDeepClean({ dry: false, onMessage });

      const allMessages = messages.join("");
      // Should mention skipping at least one
      expect(allMessages).toMatch(/not found|skipping/i);
    });

    it("should use process.stdout.write when onMessage is not provided", async () => {
      setupExecMock({
        "npm --version": new Error("not found"),
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
      });

      const mockWrite = jest.spyOn(process.stdout, "write").mockImplementation(() => true);

      try {
        await runDeepClean({});
        expect(mockWrite).toHaveBeenCalled();
      } finally {
        mockWrite.mockRestore();
      }
    });
  });

  describe("return value structure", () => {
    it("should always return an object with cleaned and totalCleaned properties", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
        "npm cache clean --force": { stdout: "", stderr: "" },
      });

      const result = await runDeepClean({ dry: false, onMessage });

      expect(result).toHaveProperty("cleaned");
      expect(result).toHaveProperty("totalCleaned");
      expect(Array.isArray(result.cleaned)).toBe(true);
      expect(typeof result.totalCleaned).toBe("number");
    });

    it("each cleaned result should have name, beforeSize, afterSize, success properties", async () => {
      setupExecMock({
        "npm --version": { stdout: "9.6.0\n", stderr: "" },
        "pnpm --version": new Error("not found"),
        "yarn --version": new Error("not found"),
        "pip --version": new Error("not found"),
        "npm cache clean --force": { stdout: "", stderr: "" },
      });

      const result = await runDeepClean({ dry: false, onMessage });

      for (const entry of result.cleaned) {
        expect(entry).toHaveProperty("name");
        expect(entry).toHaveProperty("beforeSize");
        expect(entry).toHaveProperty("afterSize");
        expect(entry).toHaveProperty("success");
        expect(typeof entry.name).toBe("string");
        expect(typeof entry.beforeSize).toBe("number");
        expect(typeof entry.afterSize).toBe("number");
        expect(typeof entry.success).toBe("boolean");
      }
    });
  });
});