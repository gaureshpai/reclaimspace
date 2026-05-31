import fs from "node:fs/promises";
import {
  formatSize,
  formatDate,
  readIgnoreFile,
  saveIgnorePatterns,
  getGlobalConfigDir,
} from "../src/utils.js";

jest.mock("node:fs/promises");

describe("utils", () => {
  describe("formatSize", () => {
    it("should format bytes correctly", () => {
      expect(formatSize(0)).toBe("0 Bytes");
      expect(formatSize(1024)).toBe("1 KB");
      expect(formatSize(1024 * 1024)).toBe("1 MB");
      expect(formatSize(1024 * 1024 * 1.5)).toBe("1.5 MB");
      expect(formatSize(1024 * 1024 * 1024)).toBe("1 GB");
    });
  });

  describe("formatDate", () => {
    it("should format dates correctly", () => {
      const date = new Date(2023, 0, 15); // Jan 15, 2023
      expect(formatDate(date)).toBe("2023-01-15");
    });

    it("should handle timestamps", () => {
      const date = new Date(2023, 5, 20).getTime(); // June 20, 2023
      expect(formatDate(date)).toBe("2023-06-20");
    });
  });

  describe("getGlobalConfigDir", () => {
    it("should return a platform-appropriate config path", () => {
      const configDir = getGlobalConfigDir();
      expect(configDir).toContain("reclaimspace");
    });
  });

  describe("readIgnoreFile", () => {
    beforeEach(() => {
      // By default, mock mkdir to resolve (for global config dir tries)
      fs.mkdir.mockResolvedValue();
    });

    it("should read patterns from .reclaimspacerc", async () => {
      // First call: local .reclaimspacerc, Second call: global .reclaimspacerc (ENOENT)
      fs.readFile
        .mockResolvedValueOnce("node_modules\n# comment\ndist\n")
        .mockRejectedValueOnce({ code: "ENOENT" });

      const patterns = await readIgnoreFile("/mock/dir");

      expect(patterns).toContain("node_modules");
      expect(patterns).toContain("dist");
      expect(patterns).not.toContain("# comment");
      // Should also contain default ignores
      expect(patterns).toContain("usr");
    });

    it("should read patterns from global config when no local file exists", async () => {
      // First call: local .reclaimspacerc (ENOENT), Second call: global .reclaimspacerc
      fs.readFile
        .mockRejectedValueOnce({ code: "ENOENT" })
        .mockResolvedValueOnce("global_pattern\n");

      const patterns = await readIgnoreFile("/mock/dir");

      expect(patterns).toContain("global_pattern");
      expect(patterns).toContain("usr"); // Defaults still present
    });

    it("should merge local and global patterns", async () => {
      fs.readFile
        .mockResolvedValueOnce("local_pattern\n")
        .mockResolvedValueOnce("global_pattern\n");

      const patterns = await readIgnoreFile("/mock/dir");

      expect(patterns).toContain("local_pattern");
      expect(patterns).toContain("global_pattern");
    });

    it("should handle both files missing", async () => {
      fs.readFile
        .mockRejectedValueOnce({ code: "ENOENT" })
        .mockRejectedValueOnce({ code: "ENOENT" });

      const patterns = await readIgnoreFile("/mock/dir");
      expect(patterns).toBeDefined();
      expect(patterns).toContain("usr"); // Only defaults
    });

    it("should throw other errors", async () => {
      fs.readFile.mockRejectedValueOnce(new Error("Permission denied"));

      await expect(readIgnoreFile("/mock/dir")).rejects.toThrow("Permission denied");
    });

    it("should local patterns override global (last dedup wins)", async () => {
      fs.readFile
        .mockResolvedValueOnce("common_pattern\n")
        .mockResolvedValueOnce("common_pattern\n");

      const patterns = await readIgnoreFile("/mock/dir");

      // Should only appear once
      const count = patterns.filter((p) => p === "common_pattern").length;
      expect(count).toBe(1);
    });
  });

  describe("saveIgnorePatterns", () => {
    beforeEach(() => {
      fs.mkdir.mockResolvedValue();
    });

    it("should save patterns to global config directory", async () => {
      fs.readFile.mockRejectedValue({ code: "ENOENT" });
      fs.writeFile.mockResolvedValue();

      const configPath = await saveIgnorePatterns(["node_modules", "dist"]);

      expect(configPath).toContain("reclaimspace");
      expect(configPath).toContain(".reclaimspacerc");
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(configPath, "node_modules\ndist\n", "utf-8");
    });

    it("should append patterns to an existing global .reclaimspacerc", async () => {
      fs.readFile.mockResolvedValue("existing_pattern\n");
      fs.writeFile.mockResolvedValue();

      const configPath = await saveIgnorePatterns(["new_pattern"]);

      expect(fs.writeFile).toHaveBeenCalledWith(
        configPath,
        "existing_pattern\nnew_pattern\n",
        "utf-8",
      );
    });

    it("should not add duplicate patterns", async () => {
      fs.readFile.mockResolvedValue("existing_pattern\n");
      fs.writeFile.mockResolvedValue();

      await saveIgnorePatterns(["existing_pattern", "new_pattern"]);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(".reclaimspacerc"),
        "existing_pattern\nnew_pattern\n",
        "utf-8",
      );
    });

    it("should handle existing file without trailing newline", async () => {
      fs.readFile.mockResolvedValue("existing_pattern");
      fs.writeFile.mockResolvedValue();

      await saveIgnorePatterns(["new_pattern"]);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(".reclaimspacerc"),
        "existing_pattern\nnew_pattern\n",
        "utf-8",
      );
    });

    it("should create the global config directory if it doesn't exist", async () => {
      fs.readFile.mockRejectedValue({ code: "ENOENT" });
      fs.writeFile.mockResolvedValue();

      await saveIgnorePatterns(["test_pattern"]);

      expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining("reclaimspace"), {
        recursive: true,
      });
    });
  });
});
