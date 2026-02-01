import fs from "node:fs/promises";
import { formatSize, formatDate, readIgnoreFile } from "../src/utils.js";

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

  describe("readIgnoreFile", () => {
    it("should read patterns from .reclaimspacerc", async () => {
      fs.readFile.mockResolvedValue("node_modules\n# comment\ndist\n");
      const patterns = await readIgnoreFile("/mock/dir");

      expect(patterns).toContain("node_modules");
      expect(patterns).toContain("dist");
      expect(patterns).not.toContain("# comment");
      // Should also contain default ignores
      expect(patterns).toContain("/usr");
    });

    it("should handle missing ignore file", async () => {
      const error = new Error("File not found");
      error.code = "ENOENT";
      fs.readFile.mockRejectedValue(error);

      const patterns = await readIgnoreFile("/mock/dir");
      expect(patterns).toBeDefined();
      expect(patterns).toContain("/usr"); // Only defaults
    });

    it("should throw other errors", async () => {
      fs.readFile.mockRejectedValue(new Error("Permission denied"));
      await expect(readIgnoreFile("/mock/dir")).rejects.toThrow("Permission denied");
    });
  });
});
