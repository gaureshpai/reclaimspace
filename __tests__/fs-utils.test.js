import fs from "node:fs/promises";
import { getFolderSize, removePath } from "../src/lib/fs-utils.js";

jest.mock("node:fs/promises");

describe("fs-utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getFolderSize", () => {
    it("should calculate folder size recursively", async () => {
      fs.readdir.mockResolvedValueOnce([
        { name: "file1.txt", isFile: () => true, isDirectory: () => false },
        { name: "subdir", isFile: () => false, isDirectory: () => true },
      ]);
      fs.readdir.mockResolvedValueOnce([
        { name: "file2.txt", isFile: () => true, isDirectory: () => false },
      ]);

      fs.stat.mockImplementation((filePath) => {
        if (filePath.endsWith("file1.txt")) return Promise.resolve({ size: 100 });
        if (filePath.endsWith("file2.txt")) return Promise.resolve({ size: 200 });
        return Promise.resolve({ size: 0 });
      });

      const size = await getFolderSize("/root");
      expect(size).toBe(300);
      expect(fs.readdir).toHaveBeenCalledTimes(2);
    });

    it("should ignore ENOENT and EACCES errors", async () => {
      const error = new Error("Access denied");
      error.code = "EACCES";
      fs.readdir.mockRejectedValue(error);

      const size = await getFolderSize("/restricted");
      expect(size).toBe(0);
      // No error thrown
    });
  });

  describe("removePath", () => {
    it("should call fs.rm with correct options", async () => {
      fs.rm.mockResolvedValue(undefined);
      await removePath("/to/delete");
      expect(fs.rm).toHaveBeenCalledWith("/to/delete", { recursive: true, force: true });
    });

    it("should retry on EBUSY", async () => {
      const error = new Error("Busy");
      error.code = "EBUSY";
      fs.rm.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);

      await removePath("/busy/file", 2, 10);
      expect(fs.rm).toHaveBeenCalledTimes(2);
    });

    it("should throw after max retries", async () => {
      const error = new Error("Busy");
      error.code = "EBUSY";
      fs.rm.mockRejectedValue(error);

      await expect(removePath("/locked/file", 2, 10)).rejects.toThrow("Busy");
      expect(fs.rm).toHaveBeenCalledTimes(2);
    });
  });
});
