import fs from "node:fs/promises";
import path from "node:path";
import * as scanner from "../src/scanner.js";
import minimatch from "../src/lib/match.js";

const FIXTURES_DIR = path.join(__dirname, "fixtures");

// Helper to create a directory and dummy files inside it to give it size
const createDummyDir = async (dirPath, size = 1024, files = ["dummy.txt"]) => {
  await fs.mkdir(dirPath, { recursive: true });
  for (const file of files) {
    await fs.writeFile(path.join(dirPath, file), Buffer.alloc(size / files.length));
  }
};

beforeAll(async () => {
  await fs.mkdir(FIXTURES_DIR, { recursive: true });
  // Create a mock project structure
  await createDummyDir(path.join(FIXTURES_DIR, "project1", "node_modules"), 5000);
  await createDummyDir(path.join(FIXTURES_DIR, "project1", "dist"), 2000, ["index.js"]);
  await createDummyDir(path.join(FIXTURES_DIR, "project2", ".next"), 3000, ["index.js"]);
  await createDummyDir(path.join(FIXTURES_DIR, "project2", "coverage"), 1000);
  await createDummyDir(path.join(FIXTURES_DIR, "project3", "ignored-folder"), 500);
});

afterAll(async () => {
  await fs.rm(FIXTURES_DIR, { recursive: true, force: true });
});

describe("scanner", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("should find, categorize, and sort targets correctly", async () => {
    const mockOnProgress = {
      start: () => {},
      increment: () => {},
      stop: () => {},
    };
    const mockSpinner = {
      stop: () => {},
      text: "",
    };

    const { targets, totalSize } = await scanner.find(
      [FIXTURES_DIR],
      ["ignored-folder"],
      mockOnProgress,
      mockSpinner,
    );

    // 1. Check total size (approximate)
    expect(totalSize).toBeGreaterThanOrEqual(11000);

    // 2. Check if all targets were found (excluding ignored)
    expect(targets).toHaveLength(4);

    // 3. Check categorization and order
    // Order: node_modules -> build -> testing
    expect(targets[0].name).toBe("node_modules");
    expect(targets[0].category).toBe("node_modules");

    // The next two can be .next or dist, sorted by size
    const buildFolders = [targets[1].name, targets[2].name].sort();
    expect(buildFolders).toEqual([".next", "dist"]);
    expect(targets[1].category).toBe("build");
    expect(targets[2].category).toBe("build");
    // Note: The order of build folders is not guaranteed if sizes are close, so we check size sorting logic if needed
    // For this test, we assume .next is larger than dist.
    expect(targets.find((t) => t.name === ".next").size).toBeGreaterThan(
      targets.find((t) => t.name === "dist").size,
    );

    expect(targets[3].name).toBe("coverage");
    expect(targets[3].category).toBe("testing");

    // 4. Check that the ignored folder is not present
    const ignored = targets.find((t) => t.name === "ignored-folder");
    expect(ignored).toBeUndefined();
  });

  it("should suppress EPERM errors during directory collection", async () => {
    const mockReaddir = jest.spyOn(fs, "readdir");
    mockReaddir.mockImplementationOnce(() => {
      const error = new Error("Operation not permitted");
      error.code = "EPERM";
      throw error;
    });

    const mockOnProgress = {
      start: () => {},
      increment: () => {},
      stop: () => {},
    };
    const mockSpinner = {
      stop: () => {},
      text: "",
    };

    await scanner.find([FIXTURES_DIR], [], mockOnProgress, mockSpinner);

    expect(console.error).not.toHaveBeenCalled();

    mockReaddir.mockRestore();
  });

  it("should suppress invalid pattern errors from minimatch", async () => {
    const mockMinimatch = jest.spyOn(minimatch, "minimatch");
    mockMinimatch.mockImplementationOnce(() => {
      throw new Error("invalid pattern");
    });

    const mockOnProgress = {
      start: () => {},
      increment: () => {},
      stop: () => {},
    };
    const mockSpinner = {
      stop: () => {},
      text: "",
    };

    // We need to pass an ignore pattern to trigger the minimatch call
    await scanner.find([FIXTURES_DIR], ["invalid-pattern-test"], mockOnProgress, mockSpinner);

    expect(console.error).not.toHaveBeenCalled();

    mockMinimatch.mockRestore();
  });

  it("should ignore Program Files directories", async () => {
    const programFilesDir = path.join(FIXTURES_DIR, "Program Files");
    const programFilesX86Dir = path.join(FIXTURES_DIR, "Program Files (x86)");

    await createDummyDir(programFilesDir, 100);
    await createDummyDir(programFilesX86Dir, 100);

    const mockOnProgress = {
      start: () => {},
      increment: () => {},
      stop: () => {},
    };
    const mockSpinner = {
      stop: () => {},
      text: "",
    };

    const ignorePatterns = ["Program Files", "Program Files (x86)"];

    const { targets } = await scanner.find(
      [FIXTURES_DIR],
      ignorePatterns,
      mockOnProgress,
      mockSpinner,
    );

    const programFilesTarget = targets.find((t) => t.path === programFilesDir);
    const programFilesX86Target = targets.find((t) => t.path === programFilesX86Dir);

    expect(programFilesTarget).toBeUndefined();
    expect(programFilesX86Target).toBeUndefined();
  });

  it("should only find targets that match the include patterns", async () => {
    const includeTestDir = path.join(FIXTURES_DIR, "include-test");
    await createDummyDir(path.join(includeTestDir, "custom-build"), 1500);
    await createDummyDir(path.join(includeTestDir, "custom-dist"), 2500);
    await createDummyDir(path.join(includeTestDir, "not-included"), 1000);

    const mockOnProgress = {
      start: () => {},
      increment: () => {},
      stop: () => {},
    };
    const mockSpinner = {
      stop: () => {},
      text: "",
    };

    const includePatterns = ["custom-build", "custom-dist"];
    const { targets, totalSize } = await scanner.find(
      [includeTestDir],
      [],
      mockOnProgress,
      mockSpinner,
      includePatterns,
    );

    expect(targets).toHaveLength(2);
    expect(totalSize).toBeGreaterThanOrEqual(4000);

    const names = targets.map((t) => t.name).sort();
    expect(names).toEqual(["custom-build", "custom-dist"]);

    expect(targets[0].category).toBe("custom");
    expect(targets[1].category).toBe("custom");
  });
});
