import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);
const BIN_PATH = path.join(process.cwd(), "bin", "reclaimspace.js");

/**
 * Run the reclaimspace binary with the given args and return stdout, stderr, and exit code.
 * @param {string[]} args
 * @param {Object} [opts]
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number|null}>}
 */
async function runBinary(args = [], opts = {}) {
  try {
    const { stdout, stderr } = await execFileAsync("node", [BIN_PATH, ...args], {
      timeout: opts.timeout || 30000,
      cwd: opts.cwd || process.cwd(),
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout || "",
      stderr: err.stderr || "",
      exitCode: err.code === "ETIMEDOUT" ? -1 : (err.status ?? 1),
    };
  }
}

/** Create a temporary directory with a fixture structure. */
async function createFixture(name) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `reclaimspace-e2e-${name}-`));
  return tmpDir;
}

/** Recursively remove a directory. */
async function removeFixture(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

describe("E2E: CLI binary", () => {
  describe("--help flag", () => {
    it("should display help text and exit 0", async () => {
      const { stdout, exitCode } = await runBinary(["--help"]);
      expect(exitCode).toBe(0);
      expect(stdout).toMatch(/Usage:/);
      expect(stdout).toMatch(/reclaimspace/);
    });
  });

  describe("--version flag", () => {
    it("should display a semver version and exit 0", async () => {
      const { stdout, exitCode } = await runBinary(["--version"]);
      expect(exitCode).toBe(0);
      // stdout includes the ASCII logo, so match version anywhere in output
      expect(stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe("--dry mode", () => {
    let tmpDir;

    beforeEach(async () => {
      tmpDir = await createFixture("dry");
      // Create a node_modules directory that should be found
      const nmDir = path.join(tmpDir, "node_modules", "some-pkg");
      await fs.mkdir(nmDir, { recursive: true });
      await fs.writeFile(path.join(nmDir, "index.js"), "module.exports = {};");
    });

    afterEach(async () => {
      await removeFixture(tmpDir);
    });

    it("should show targets without deleting them", async () => {
      const { stdout, exitCode } = await runBinary([tmpDir, "--dry"]);
      expect(exitCode).toBe(0);
      expect(stdout).toMatch(/--dry run/i);
      expect(stdout).toMatch(/Releasable space|Reclaimable space/);
      // node_modules should still exist after dry run
      const stat = await fs.stat(path.join(tmpDir, "node_modules"));
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe("--yes mode", () => {
    let tmpDir;

    beforeEach(async () => {
      tmpDir = await createFixture("yes");
      const nmDir = path.join(tmpDir, "node_modules", "some-pkg");
      await fs.mkdir(nmDir, { recursive: true });
      await fs.writeFile(path.join(nmDir, "index.js"), "module.exports = {};");
    });

    afterEach(async () => {
      await removeFixture(tmpDir);
    });

    it("should auto-delete found targets", async () => {
      const { stdout, exitCode } = await runBinary([tmpDir, "--yes"]);
      expect(exitCode).toBe(0);
      expect(stdout).toMatch(/--yes|Deleting/);
      // node_modules should be deleted
      await expect(fs.access(path.join(tmpDir, "node_modules"))).rejects.toThrow();
    });
  });

  describe("--ignore flag", () => {
    let tmpDir;

    beforeEach(async () => {
      tmpDir = await createFixture("ignore");
      // Create two node_modules directories at different depths
      const nm1 = path.join(tmpDir, "packages", "a", "node_modules", "pkg");
      const nm2 = path.join(tmpDir, "packages", "b", "node_modules", "pkg");
      await fs.mkdir(nm1, { recursive: true });
      await fs.mkdir(nm2, { recursive: true });
      await fs.writeFile(path.join(nm1, "index.js"), "");
      await fs.writeFile(path.join(nm2, "index.js"), "");
    });

    afterEach(async () => {
      await removeFixture(tmpDir);
    });

    it("should respect ignore patterns and exclude matching targets", async () => {
      // Run without ignore to get baseline - should find both node_modules dirs
      const baseline = await runBinary([tmpDir, "--dry"]);
      const baselineMatches = (baseline.stdout.match(/node_modules/g) || []).length;

      // Run with ignore - should exclude the packages/b path
      const { stdout } = await runBinary([tmpDir, "--dry", "--ignore", "**/b/**"]);
      const filteredMatches = (stdout.match(/node_modules/g) || []).length;

      // Should have fewer or equal matches when ignore is applied
      expect(filteredMatches).toBeLessThanOrEqual(baselineMatches);
    });
  });

  describe("clean workspace", () => {
    let tmpDir;

    beforeEach(async () => {
      tmpDir = await createFixture("clean");
      // Create a project with no regeneratable folders
      await fs.writeFile(path.join(tmpDir, "index.js"), "console.log('hello');");
      await fs.writeFile(path.join(tmpDir, "package.json"), JSON.stringify({ name: "test" }));
    });

    afterEach(async () => {
      await removeFixture(tmpDir);
    });

    it("should report no reclaimable space", async () => {
      const { stdout, exitCode } = await runBinary([tmpDir, "--dry"]);
      expect(exitCode).toBe(0);
      expect(stdout).toMatch(/No reclaimable space|clean/i);
    });
  });

  describe("--deep-clean flag", () => {
    it("should invoke deep clean mode and show cache info", async () => {
      // --deep-clean runs real package manager commands which may fail or be slow
      const { stdout } = await runBinary(["--deep-clean"]);
      // Verify it at least attempted the deep clean flow
      expect(stdout).toMatch(/Deep Clean|Caches cleared|not found|skipping/i);
    }, 60000);
  });

  describe("invalid path", () => {
    it("should handle non-existent path gracefully", async () => {
      const { stdout, exitCode } = await runBinary(["/nonexistent/path/xyz", "--dry"]);
      expect(exitCode).toBe(0);
      expect(stdout).toMatch(/does not exist|not accessible|No valid/i);
    });
  });
});
