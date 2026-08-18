import fs from "node:fs";
import path from "node:path";

describe("esbuild bundle pipeline configuration", () => {
  describe("package.json", () => {
    const pkgPath = path.join(process.cwd(), "package.json");
    let pkg;

    beforeAll(() => {
      pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    });

    it("should expose a bin entry pointing at the minified dist bundle", () => {
      expect(pkg.bin.reclaimspace).toBe("dist/reclaimspace.min.js");
    });

    it("should not reference the raw bin/ file as the bin entry anymore", () => {
      expect(pkg.bin.reclaimspace).not.toBe("bin/reclaimspace.js");
    });

    it("should include dist/ (not bin/) in the published files list", () => {
      expect(pkg.files).toContain("dist/");
      expect(pkg.files).not.toContain("bin/");
    });

    it("should still include src/ in the published files list", () => {
      expect(pkg.files).toContain("src/");
    });

    it("should define an 'exports' field for programmatic usage", () => {
      expect(pkg.exports).toEqual({ ".": "./src/main.js" });
    });

    it("should keep 'main' pointing at src/main.js for backward compatibility", () => {
      expect(pkg.main).toBe("src/main.js");
    });

    it("should define a 'build' script that runs scripts/build.js", () => {
      expect(pkg.scripts.build).toBe("node scripts/build.js");
    });

    it("should define a 'prepublishOnly' script that runs the build first", () => {
      expect(pkg.scripts.prepublishOnly).toBe("pnpm build");
    });

    it("should list esbuild ^0.25.x as a devDependency", () => {
      expect(pkg.devDependencies).toHaveProperty("esbuild");
      expect(pkg.devDependencies.esbuild).toMatch(/^\^0\.25\./);
    });
  });

  describe(".gitignore", () => {
    const gitignorePath = path.join(process.cwd(), ".gitignore");
    let gitignore;

    beforeAll(() => {
      gitignore = fs.readFileSync(gitignorePath, "utf8");
    });

    it("should ignore the dist/ build output directory", () => {
      expect(gitignore.split("\n")).toContain("dist/");
    });

    it("should still allow the test.yml workflow file", () => {
      expect(gitignore).toContain("!.github/workflows/test.yml");
    });

    it("should still ignore node_modules", () => {
      expect(gitignore.split("\n")).toContain("node_modules");
    });
  });

  describe("CHANGELOG.md", () => {
    const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
    let changelog;

    beforeAll(() => {
      changelog = fs.readFileSync(changelogPath, "utf8");
    });

    it("should document the esbuild bundle pipeline entry", () => {
      expect(changelog).toContain("## 2026-08-18");
      expect(changelog).toContain("esbuild Bundle Pipeline");
    });

    it("should mention the minified dist output file", () => {
      expect(changelog).toContain("dist/reclaimspace.min.js");
    });

    it("should mention the exports field for programmatic usage", () => {
      expect(changelog).toContain("import { run } from 'reclaimspace'");
    });

    it("should mention the optional chaining fix in src/ui.js", () => {
      expect(changelog).toContain("process.stdin?.isPaused()");
    });

    it("should be prepended above the previous release entry", () => {
      const newEntryIdx = changelog.indexOf("## 2026-08-18");
      const previousEntryIdx = changelog.indexOf("## 2026-06-06");
      expect(newEntryIdx).toBeGreaterThan(-1);
      expect(previousEntryIdx).toBeGreaterThan(newEntryIdx);
    });
  });

  describe("scripts/build.js", () => {
    const buildScriptPath = path.join(process.cwd(), "scripts", "build.js");
    let source;

    beforeAll(() => {
      source = fs.readFileSync(buildScriptPath, "utf8");
    });

    it("should exist", () => {
      expect(fs.existsSync(buildScriptPath)).toBe(true);
    });

    it("should import build from esbuild", () => {
      expect(source).toMatch(/import\s*\{\s*build\s*\}\s*from\s*["']esbuild["']/);
    });

    it("should bundle bin/reclaimspace.js as the entry point", () => {
      expect(source).toMatch(/entryPoints:\s*\[\s*["']bin\/reclaimspace\.js["']\s*\]/);
    });

    it("should enable bundling and minification", () => {
      expect(source).toMatch(/bundle:\s*true/);
      expect(source).toMatch(/minify:\s*true/);
    });

    it("should target the node platform using the esm output format", () => {
      expect(source).toMatch(/platform:\s*["']node["']/);
      expect(source).toMatch(/format:\s*["']esm["']/);
    });

    it("should output to dist/reclaimspace.min.js", () => {
      expect(source).toMatch(/outfile:\s*["']dist\/reclaimspace\.min\.js["']/);
    });

    it("should add a shebang banner so the bundle is directly executable", () => {
      expect(source).toMatch(/banner:\s*\{\s*js:\s*["']#!\/usr\/bin\/env node["']\s*\}/);
    });
  });

  describe("consistency between test suites and the build output paths", () => {
    it("e2e.test.js should point at the bundled dist executable, not the raw bin file", () => {
      const e2eSource = fs.readFileSync(
        path.join(process.cwd(), "__tests__", "e2e.test.js"),
        "utf8",
      );
      expect(e2eSource).toContain('path.join(process.cwd(), "dist", "reclaimspace.min.js")');
      expect(e2eSource).not.toContain('path.join(process.cwd(), "bin", "reclaimspace.js")');
    });

    it("package-export.test.js should assert the bin field resolves to the dist bundle", () => {
      const exportTestSource = fs.readFileSync(
        path.join(process.cwd(), "__tests__", "package-export.test.js"),
        "utf8",
      );
      expect(exportTestSource).toContain("dist/reclaimspace.min.js");
    });
  });
});