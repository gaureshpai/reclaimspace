import fs from "node:fs";
import path from "node:path";

describe("bin/reclaimspace.js entry point", () => {
  afterEach(() => {
    jest.dontMock("../src/main.js");
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("should invoke run() from src/main.js with process.cwd() as the base directory", async () => {
    jest.resetModules();
    const runMock = jest.fn();
    jest.doMock("../src/main.js", () => ({ run: runMock }));
    jest.spyOn(process, "cwd").mockReturnValue("/fake/base/dir");

    await import("../bin/reclaimspace.js");

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith("/fake/base/dir");
  });

  it("should resolve baseDir from process.cwd() at load time for a different directory", async () => {
    jest.resetModules();
    const runMock = jest.fn();
    jest.doMock("../src/main.js", () => ({ run: runMock }));
    jest.spyOn(process, "cwd").mockReturnValue("/another/project/dir");

    await import("../bin/reclaimspace.js");

    expect(runMock).toHaveBeenCalledWith("/another/project/dir");
  });

  describe("source content", () => {
    let binSource;

    beforeAll(() => {
      binSource = fs.readFileSync(path.join(process.cwd(), "bin", "reclaimspace.js"), "utf8");
    });

    it("should not contain a shebang line (esbuild banner adds it at build time)", () => {
      expect(binSource.startsWith("#!/usr/bin/env node")).toBe(false);
      expect(binSource).not.toMatch(/^#!/);
    });

    it("should import run from src/main.js", () => {
      expect(binSource).toContain('import { run } from "../src/main.js"');
    });

    it("should call run() with the resolved base directory", () => {
      expect(binSource).toContain("run(baseDir)");
    });
  });
});