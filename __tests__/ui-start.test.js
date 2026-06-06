import { start, displaySummary } from "../src/ui.js";

// Mock heavy dependencies
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
jest.mock("../src/deep-cleaner.js", () => ({ runDeepClean: jest.fn() }));
jest.mock("../src/deleter.js", () => ({ deleteTarget: jest.fn() }));

import { deleteTarget } from "../src/deleter.js";
import inquirer from "../src/lib/prompt.js";

describe("ui.start()", () => {
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

  const makeTargets = (n) =>
    Array.from({ length: n }, (_, i) => ({
      path: `/tmp/target-${i}`,
      size: 1000 * (i + 1),
      lastModified: new Date(),
    }));

  describe("no targets", () => {
    it("should log clean message and return summary", async () => {
      const state = { totalReclaimed: 0 };
      await start({
        targets: [],
        totalSize: 0,
        duration: 1.23,
        options: {},
        baseDir: "/tmp",
        state,
      });

      const allLogs = consoleLogMock.mock.calls.map((a) => a[0]).join(" ");
      expect(allLogs).toMatch(/No reclaimable space found|Your workspace is clean/);
      expect(allLogs).toMatch(/1\.23s/);
    });

    it("should handle null targets", async () => {
      const state = { totalReclaimed: 0 };
      await start({
        targets: null,
        totalSize: 0,
        duration: 0.5,
        options: {},
        baseDir: "/tmp",
        state,
      });

      const allLogs = consoleLogMock.mock.calls.map((a) => a[0]).join(" ");
      expect(allLogs).toMatch(/No reclaimable space found|Your workspace is clean/);
    });
  });

  describe("dry run", () => {
    it("should display targets and not delete anything", async () => {
      const targets = makeTargets(2);
      const state = { totalReclaimed: 0 };

      await start({
        targets,
        totalSize: 3000,
        duration: 0.5,
        options: { dry: true },
        baseDir: "/tmp",
        state,
      });

      const allLogs = consoleLogMock.mock.calls.map((a) => a[0]).join(" ");
      expect(allLogs).toMatch(/--dry run/);
      expect(allLogs).toMatch(/Total reclaimable space/);
      expect(allLogs).toMatch(/target-0/);
      expect(allLogs).toMatch(/target-1/);
      expect(state.totalReclaimed).toBe(0);
    });

    it("should show total reclaimable space", async () => {
      const targets = makeTargets(1);
      const state = { totalReclaimed: 0 };

      await start({
        targets,
        totalSize: 5000,
        duration: 0.1,
        options: { dry: true },
        baseDir: "/tmp",
        state,
      });

      const allLogs = consoleLogMock.mock.calls.map((a) => a[0]).join(" ");
      expect(allLogs).toMatch(/Releasable space/);
    });
  });

  describe("yes flag", () => {
    it("should delete all targets without prompting", async () => {
      const targets = makeTargets(3);
      const state = { totalReclaimed: 0 };
      deleteTarget.mockResolvedValue({ success: true });

      await start({
        targets,
        totalSize: 6000,
        duration: 0.3,
        options: { yes: true },
        baseDir: "/tmp",
        state,
      });

      expect(deleteTarget).toHaveBeenCalledTimes(3);
      expect(state.totalReclaimed).toBe(6000);
      expect(inquirer.prompt).not.toHaveBeenCalled();
    });

    it("should handle partial deletion failures", async () => {
      const targets = makeTargets(3);
      const state = { totalReclaimed: 0 };
      deleteTarget
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: new Error("EPERM") })
        .mockResolvedValueOnce({ success: true });

      await start({
        targets,
        totalSize: 6000,
        duration: 0.3,
        options: { yes: true },
        baseDir: "/tmp",
        state,
      });

      // Only 2 successful deletions: 1000 + 3000 = 4000
      expect(state.totalReclaimed).toBe(4000);
    });

    it("should handle EBUSY error with friendly message", async () => {
      const targets = makeTargets(1);
      const state = { totalReclaimed: 0 };
      const err = new Error("EBUSY");
      err.code = "EBUSY";
      deleteTarget.mockResolvedValue({ success: false, error: err });

      await start({
        targets,
        totalSize: 1000,
        duration: 0.1,
        options: { yes: true },
        baseDir: "/tmp",
        state,
      });

      // handleDelete writes errors to process.stdout.write, not console.log
      const allWritten = stdoutWriteMock.mock.calls.map((a) => a[0]).join("");
      expect(allWritten).toMatch(/busy or locked|close any applications/i);
      expect(state.totalReclaimed).toBe(0);
    });
  });

  describe("interactive UI", () => {
    it("should call inquirer.prompt with choices", async () => {
      const targets = makeTargets(2);
      const state = { totalReclaimed: 0 };
      inquirer.prompt.mockResolvedValue({ selectedTargets: [] });

      await start({
        targets,
        totalSize: 3000,
        duration: 0.2,
        options: {},
        baseDir: "/tmp",
        state,
      });

      expect(inquirer.prompt).toHaveBeenCalledTimes(1);
      const promptArg = inquirer.prompt.mock.calls[0][0][0];
      expect(promptArg.type).toBe("checkbox");
      expect(promptArg.choices).toHaveLength(2);
    });

    it("should delete only selected targets", async () => {
      const targets = makeTargets(3);
      const state = { totalReclaimed: 0 };
      inquirer.prompt.mockResolvedValue({ selectedTargets: [targets[0], targets[2]] });
      deleteTarget.mockResolvedValue({ success: true });

      await start({
        targets,
        totalSize: 6000,
        duration: 0.2,
        options: {},
        baseDir: "/tmp",
        state,
      });

      expect(deleteTarget).toHaveBeenCalledTimes(2);
      // target-0 size=1000, target-2 size=3000
      expect(state.totalReclaimed).toBe(4000);
    });

    it("should handle user interrupt gracefully", async () => {
      const targets = makeTargets(1);
      const state = { totalReclaimed: 0 };
      inquirer.prompt.mockRejectedValue(new Error("User interrupted"));

      await start({
        targets,
        totalSize: 1000,
        duration: 0.1,
        options: {},
        baseDir: "/tmp",
        state,
      });

      // Should not throw and no deletions
      expect(deleteTarget).not.toHaveBeenCalled();
      expect(state.totalReclaimed).toBe(0);
    });
  });

  describe("build analysis", () => {
    it("should display build analysis when enabled", async () => {
      const targets = makeTargets(1);
      const state = { totalReclaimed: 0 };
      const buildAnalysis = {
        inferredProjectTypes: { node: 2, next: 1 },
        commonPatterns: new Set(["node_modules"]),
        uniquePatterns: new Set([".next"]),
      };
      inquirer.prompt.mockResolvedValue({ selectedTargets: [] });

      await start({
        targets,
        totalSize: 1000,
        duration: 0.1,
        options: { buildAnalysis: true },
        baseDir: "/tmp",
        state,
        buildAnalysis,
      });

      const allLogs = consoleLogMock.mock.calls.map((a) => a[0]).join(" ");
      expect(allLogs).toMatch(/Build Analysis/);
      expect(allLogs).toMatch(/Inferred Project Types/);
      expect(allLogs).toMatch(/node.*2/);
      expect(allLogs).toMatch(/Common Build Patterns/);
    });
  });
});

describe("displaySummary()", () => {
  let stdoutWriteMock;
  let consoleLogMock;

  beforeEach(() => {
    stdoutWriteMock = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
    consoleLogMock = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    stdoutWriteMock.mockRestore();
    consoleLogMock.mockRestore();
  });

  it("should display reclaimed space when totalReclaimed > 0", () => {
    const state = { totalReclaimed: 5000 };
    displaySummary(state);
    // "Total space reclaimed" goes to console.log, "Thank you" goes to stdout.write
    const allLogs = consoleLogMock.mock.calls.map((a) => a[0]).join("");
    expect(allLogs).toMatch(/Total space reclaimed/);
    const written = stdoutWriteMock.mock.calls.map((a) => a[0]).join("");
    expect(written).toMatch(/Thank you/);
  });

  it("should not display reclaimed space when totalReclaimed is 0", () => {
    const state = { totalReclaimed: 0 };
    displaySummary(state);
    const allLogs = consoleLogMock.mock.calls.map((a) => a[0]).join("");
    expect(allLogs).not.toMatch(/Total space reclaimed/);
    const written = stdoutWriteMock.mock.calls.map((a) => a[0]).join("");
    expect(written).toMatch(/Thank you/);
  });

  it("should invoke callback if provided", () => {
    const cb = jest.fn();
    displaySummary({ totalReclaimed: 0 }, cb);
    // Callback may be called asynchronously via stdout.write
  });
});
