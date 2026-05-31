import { runDeepCleanWithUI } from "../src/ui.js";

// Mock runDeepClean so we control results without running real commands.
jest.mock("../src/deep-cleaner.js", () => ({
  runDeepClean: jest.fn(),
}));

// Mock heavy UI dependencies that would fail in test environment.
jest.mock("../src/lib/prompt.js", () => ({ prompt: jest.fn() }));
jest.mock("../src/lib/progress.js", () => ({
  SingleBar: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    update: jest.fn(),
    stop: jest.fn(),
  })),
  Presets: { shades_classic: {} },
}));
jest.mock("../src/lib/spinner.js", () =>
  jest.fn().mockReturnValue({ start: jest.fn(), stop: jest.fn(), succeed: jest.fn() }),
);
jest.mock("../src/scanner.js", () => ({ find: jest.fn() }));
jest.mock("../src/deleter.js", () => ({ deleteTarget: jest.fn() }));

import { runDeepClean } from "../src/deep-cleaner.js";

describe("runDeepCleanWithUI", () => {
  let consoleLogMock;
  let stdoutWriteMock;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogMock = jest.spyOn(console, "log").mockImplementation(() => {});
    stdoutWriteMock = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    consoleLogMock.mockRestore();
    stdoutWriteMock.mockRestore();
  });

  describe("dry mode", () => {
    it("should log dry run notice before calling runDeepClean", async () => {
      runDeepClean.mockResolvedValue({ cleaned: [], totalCleaned: 0 });

      await runDeepCleanWithUI({ dry: true });

      // Should log the dry run message first
      const firstLogCall = consoleLogMock.mock.calls[0]?.[0] ?? "";
      expect(firstLogCall).toMatch(/dry/i);
    });

    it("should call runDeepClean with dry:true", async () => {
      runDeepClean.mockResolvedValue({ cleaned: [], totalCleaned: 0 });

      await runDeepCleanWithUI({ dry: true });

      expect(runDeepClean).toHaveBeenCalledWith(expect.objectContaining({ dry: true }));
    });

    it("should log total cache that could be reclaimed in dry mode", async () => {
      runDeepClean.mockResolvedValue({ cleaned: [], totalCleaned: 512000 });

      await runDeepCleanWithUI({ dry: true });

      const allLogs = consoleLogMock.mock.calls.map((args) => args[0]).join(" ");
      expect(allLogs).toMatch(/could be reclaimed/i);
    });

    it("should not log success/failure counts in dry mode", async () => {
      runDeepClean.mockResolvedValue({
        cleaned: [{ name: "npm", beforeSize: 0, afterSize: 0, success: true }],
        totalCleaned: 0,
      });

      await runDeepCleanWithUI({ dry: true });

      const allLogs = consoleLogMock.mock.calls.map((args) => args[0]).join(" ");
      expect(allLogs).not.toMatch(/Caches cleared/);
      expect(allLogs).not.toMatch(/Failed/);
    });

    it("should return without logging success summary when dry", async () => {
      runDeepClean.mockResolvedValue({ cleaned: [], totalCleaned: 1024 });

      const result = await runDeepCleanWithUI({ dry: true });

      // Function returns undefined
      expect(result).toBeUndefined();
    });
  });

  describe("non-dry mode (real clean)", () => {
    it("should call runDeepClean with dry:false when options.dry is falsy", async () => {
      runDeepClean.mockResolvedValue({ cleaned: [], totalCleaned: 0 });

      await runDeepCleanWithUI({ dry: false });

      expect(runDeepClean).toHaveBeenCalledWith(expect.objectContaining({ dry: false }));
    });

    it("should log success count when at least one manager succeeds", async () => {
      runDeepClean.mockResolvedValue({
        cleaned: [
          { name: "npm", beforeSize: 0, afterSize: 0, success: true },
          { name: "pnpm", beforeSize: 0, afterSize: 0, success: true },
        ],
        totalCleaned: 0,
      });

      await runDeepCleanWithUI({ dry: false });

      const allLogs = consoleLogMock.mock.calls.map((args) => args[0]).join(" ");
      expect(allLogs).toMatch(/Caches cleared.*2/);
    });

    it("should log failure count when at least one manager fails", async () => {
      runDeepClean.mockResolvedValue({
        cleaned: [{ name: "npm", beforeSize: 0, afterSize: 0, success: false }],
        totalCleaned: 0,
      });

      await runDeepCleanWithUI({ dry: false });

      const allLogs = consoleLogMock.mock.calls.map((args) => args[0]).join(" ");
      expect(allLogs).toMatch(/Failed.*1/);
    });

    it("should log total cache reclaimed when totalCleaned > 0", async () => {
      runDeepClean.mockResolvedValue({
        cleaned: [{ name: "npm", beforeSize: 2048, afterSize: 0, success: true }],
        totalCleaned: 2048,
      });

      await runDeepCleanWithUI({ dry: false });

      const allLogs = consoleLogMock.mock.calls.map((args) => args[0]).join(" ");
      expect(allLogs).toMatch(/Total cache reclaimed/i);
    });

    it("should NOT log total cache reclaimed when totalCleaned is 0", async () => {
      runDeepClean.mockResolvedValue({
        cleaned: [{ name: "npm", beforeSize: 0, afterSize: 0, success: true }],
        totalCleaned: 0,
      });

      await runDeepCleanWithUI({ dry: false });

      const allLogs = consoleLogMock.mock.calls.map((args) => args[0]).join(" ");
      expect(allLogs).not.toMatch(/Total cache reclaimed/i);
    });

    it("should log both success and failure counts in mixed result", async () => {
      runDeepClean.mockResolvedValue({
        cleaned: [
          { name: "npm", beforeSize: 0, afterSize: 0, success: true },
          { name: "pnpm", beforeSize: 0, afterSize: 0, success: false },
        ],
        totalCleaned: 0,
      });

      await runDeepCleanWithUI({ dry: false });

      const allLogs = consoleLogMock.mock.calls.map((args) => args[0]).join(" ");
      expect(allLogs).toMatch(/Caches cleared.*1/);
      expect(allLogs).toMatch(/Failed.*1/);
    });

    it("should not log success count when cleaned array is empty", async () => {
      runDeepClean.mockResolvedValue({ cleaned: [], totalCleaned: 0 });

      await runDeepCleanWithUI({ dry: false });

      const allLogs = consoleLogMock.mock.calls.map((args) => args[0]).join(" ");
      expect(allLogs).not.toMatch(/Caches cleared/);
    });

    it("should not log failure count when no failures occur", async () => {
      runDeepClean.mockResolvedValue({
        cleaned: [{ name: "npm", beforeSize: 0, afterSize: 0, success: true }],
        totalCleaned: 0,
      });

      await runDeepCleanWithUI({ dry: false });

      const allLogs = consoleLogMock.mock.calls.map((args) => args[0]).join(" ");
      expect(allLogs).not.toMatch(/Failed/);
    });

    it("should pass onMessage callback to runDeepClean", async () => {
      runDeepClean.mockResolvedValue({ cleaned: [], totalCleaned: 0 });

      await runDeepCleanWithUI({ dry: false });

      const callArg = runDeepClean.mock.calls[0][0];
      expect(typeof callArg.onMessage).toBe("function");
    });

    it("should write to stdout via onMessage callback", async () => {
      // Capture the onMessage callback and invoke it
      let capturedOnMessage;
      runDeepClean.mockImplementation(async ({ onMessage }) => {
        capturedOnMessage = onMessage;
        return { cleaned: [], totalCleaned: 0 };
      });

      await runDeepCleanWithUI({ dry: false });

      expect(typeof capturedOnMessage).toBe("function");
      capturedOnMessage("test message");
      expect(stdoutWriteMock).toHaveBeenCalledWith("test message");
    });
  });

  describe("edge cases", () => {
    it("should handle all managers failing gracefully", async () => {
      runDeepClean.mockResolvedValue({
        cleaned: [
          { name: "npm", beforeSize: 0, afterSize: 0, success: false },
          { name: "pnpm", beforeSize: 0, afterSize: 0, success: false },
        ],
        totalCleaned: 0,
      });

      await expect(runDeepCleanWithUI({ dry: false })).resolves.toBeUndefined();

      const allLogs = consoleLogMock.mock.calls.map((args) => args[0]).join(" ");
      expect(allLogs).toMatch(/Failed.*2/);
    });

    it("should handle options without dry property (defaults to false)", async () => {
      runDeepClean.mockResolvedValue({ cleaned: [], totalCleaned: 0 });

      await runDeepCleanWithUI({});

      expect(runDeepClean).toHaveBeenCalledWith(expect.objectContaining({ dry: false }));
    });

    it("should return undefined (no return value)", async () => {
      runDeepClean.mockResolvedValue({ cleaned: [], totalCleaned: 0 });

      const result = await runDeepCleanWithUI({ dry: false });

      expect(result).toBeUndefined();
    });
  });
});
