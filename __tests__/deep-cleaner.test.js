import { detectPackageManagers, estimateCacheSize } from "../src/deep-cleaner.js";
import { formatSize } from "../src/utils.js";

describe("deep-cleaner", () => {
  describe("formatSize", () => {
    it("should return '0 Bytes' for 0 bytes", () => {
      expect(formatSize(0)).toBe("0 Bytes");
    });

    it("should format bytes correctly", () => {
      expect(formatSize(1024)).toBe("1 KB");
      expect(formatSize(1048576)).toBe("1 MB");
      expect(formatSize(1073741824)).toBe("1 GB");
    });

    it("should handle small byte values", () => {
      expect(formatSize(500)).toBe("500 Bytes");
    });

    it("should round to two decimal places", () => {
      expect(formatSize(1536)).toBe("1.5 KB");
      expect(formatSize(1580)).toBe("1.54 KB");
    });

    it("should handle very large values", () => {
      expect(formatSize(1099511627776)).toBe("1 TB");
    });
  });

  describe("estimateCacheSize", () => {
    it("should return 0 for non-existent directory", async () => {
      const size = await estimateCacheSize("/nonexistent/path/that/does/not/exist");
      expect(size).toBe(0);
    });

    it("should return 0 for an empty directory", async () => {
      const { mkdtemp } = await import("node:fs/promises");
      const { join } = await import("node:path");
      const { tmpdir } = await import("node:os");

      const tmpDir = await mkdtemp(join(tmpdir(), "deep-clean-test-"));
      const size = await estimateCacheSize(tmpDir);

      const { rm } = await import("node:fs/promises");
      await rm(tmpDir, { recursive: true, force: true });

      expect(size).toBe(0);
    });

    it("should calculate size of directory with files", async () => {
      const { mkdtemp, writeFile, mkdir } = await import("node:fs/promises");
      const { join } = await import("node:path");
      const { tmpdir } = await import("node:os");

      const tmpDir = await mkdtemp(join(tmpdir(), "deep-clean-test-"));
      await writeFile(join(tmpDir, "file1.txt"), "hello");
      await mkdir(join(tmpDir, "subdir"), { recursive: true });
      await writeFile(join(tmpDir, "subdir", "file2.txt"), "world");

      const size = await estimateCacheSize(tmpDir);

      const { rm } = await import("node:fs/promises");
      await rm(tmpDir, { recursive: true, force: true });

      // "hello" is 5 bytes, "world" is 5 bytes = 10 bytes
      expect(size).toBe(10);
    });
  });

  describe("detectPackageManagers", () => {
    it("should return an array of package manager objects", async () => {
      const managers = await detectPackageManagers();
      expect(Array.isArray(managers)).toBe(true);
      expect(managers.length).toBeGreaterThan(0);
    });

    it("should have the expected manager names", async () => {
      const managers = await detectPackageManagers();
      const names = managers.map((m) => m.name);
      expect(names).toContain("npm");
      expect(names).toContain("pnpm");
    });

    it("each manager should have required properties", async () => {
      const managers = await detectPackageManagers();
      for (const mgr of managers) {
        expect(mgr).toHaveProperty("name");
        expect(mgr).toHaveProperty("command");
        expect(mgr).toHaveProperty("available");
        expect(typeof mgr.name).toBe("string");
        expect(typeof mgr.command).toBe("string");
        expect(typeof mgr.available).toBe("boolean");
      }
    });

    it("should detect npm as available", async () => {
      const managers = await detectPackageManagers();
      const npm = managers.find((m) => m.name === "npm");
      expect(npm).toBeDefined();
      expect(npm.available).toBe(true);
      expect(npm).toHaveProperty("version");
    });

    it("should detect pnpm as available", async () => {
      const managers = await detectPackageManagers();
      const pnpm = managers.find((m) => m.name === "pnpm");
      expect(pnpm).toBeDefined();
      expect(pnpm.available).toBe(true);
      expect(pnpm).toHaveProperty("version");
    });

    it("should have a command property for each manager", async () => {
      const managers = await detectPackageManagers();
      for (const mgr of managers) {
        expect(typeof mgr.command).toBe("string");
        expect(mgr.command.length).toBeGreaterThan(0);
      }
    });

    it("npm should have correct cache clean command", async () => {
      const managers = await detectPackageManagers();
      const npm = managers.find((m) => m.name === "npm");
      expect(npm.command).toBe("npm cache clean --force");
    });

    it("pnpm should have correct cache delete command", async () => {
      const managers = await detectPackageManagers();
      const pnpm = managers.find((m) => m.name === "pnpm");
      expect(pnpm.command).toBe("pnpm cache delete");
    });
  });
});
