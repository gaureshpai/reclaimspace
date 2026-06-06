import { deleteTarget } from "../src/deleter.js";
import { removePath } from "../src/lib/fs-utils.js";

jest.mock("../src/lib/fs-utils.js", () => ({
  removePath: jest.fn(),
}));

describe("deleteTarget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return success when removePath resolves", async () => {
    removePath.mockResolvedValue(undefined);
    const result = await deleteTarget("/some/path");
    expect(result).toEqual({ success: true });
    expect(removePath).toHaveBeenCalledWith("/some/path");
  });

  it("should return failure with error when removePath rejects", async () => {
    const error = new Error("Permission denied");
    error.code = "EPERM";
    removePath.mockRejectedValue(error);

    const result = await deleteTarget("/locked/path");
    expect(result.success).toBe(false);
    expect(result.error).toBe(error);
    expect(result.error.code).toBe("EPERM");
  });

  it("should propagate EBUSY errors", async () => {
    const error = new Error("Resource busy");
    error.code = "EBUSY";
    removePath.mockRejectedValue(error);

    const result = await deleteTarget("/busy/path");
    expect(result.success).toBe(false);
    expect(result.error.code).toBe("EBUSY");
  });

  it("should handle generic errors", async () => {
    const error = new Error("Something went wrong");
    removePath.mockRejectedValue(error);

    const result = await deleteTarget("/some/path");
    expect(result.success).toBe(false);
    expect(result.error.message).toBe("Something went wrong");
  });

  it("should pass the path to removePath", async () => {
    removePath.mockResolvedValue(undefined);
    await deleteTarget("/a/very/long/path/to/folder");
    expect(removePath).toHaveBeenCalledWith("/a/very/long/path/to/folder");
  });

  it("should return exactly { success: true } on success (no extra properties)", async () => {
    removePath.mockResolvedValue(undefined);
    const result = await deleteTarget("/ok");
    expect(result).toEqual({ success: true });
    expect(Object.keys(result)).toEqual(["success"]);
  });
});
