import fs from "node:fs";
import path from "node:path";

describe("Documentation", () => {
  describe("README.md", () => {
    const readmePath = path.join(process.cwd(), "README.md");
    let readme;

    beforeAll(() => {
      readme = fs.readFileSync(readmePath, "utf8");
    });

    it("should exist", () => {
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    describe("global config paths (PR changes)", () => {
      it("should document the global flag as '(global)' in the heading", () => {
        expect(readme).toContain("permanently (global)");
      });

      it("should reference %APPDATA% for Windows global config", () => {
        expect(readme).toContain("%APPDATA%");
      });

      it("should reference ~/Library/Application Support for macOS global config", () => {
        expect(readme).toContain("~/Library/Application Support");
      });

      it("should reference ~/.config for Linux global config", () => {
        expect(readme).toContain("~/.config/reclaimspace/");
      });

      it("should mention reclaimspace in all platform config paths", () => {
        expect(readme).toContain("%APPDATA%\\\\reclaimspace\\\\");
        expect(readme).toContain("Application Support/reclaimspace/");
        expect(readme).toContain(".config/reclaimspace/");
      });

      it("should have a 'Global Ignore Patterns' section", () => {
        expect(readme).toContain("### Global Ignore Patterns");
      });

      it("Global Ignore Patterns section should list platform-specific paths", () => {
        const globalSection = readme.substring(
          readme.indexOf("### Global Ignore Patterns"),
          readme.indexOf("### Default Ignore Patterns"),
        );
        expect(globalSection).toContain("Windows");
        expect(globalSection).toContain("macOS");
        expect(globalSection).toContain("Linux");
      });
    });

    describe("Default Ignore Patterns section (PR changes)", () => {
      it("should have a 'Default Ignore Patterns' section", () => {
        expect(readme).toContain("### Default Ignore Patterns");
      });

      it("should mention common system directories in default patterns", () => {
        const defaultSection = readme.substring(
          readme.indexOf("### Default Ignore Patterns"),
        );
        expect(defaultSection).toContain("Program Files");
        expect(defaultSection).toContain(".vscode");
        expect(defaultSection).toContain(".pnpm-store");
      });

      it("should not be empty", () => {
        const defaultSection = readme.substring(
          readme.indexOf("### Default Ignore Patterns"),
          readme.indexOf("### Example"),
        );
        expect(defaultSection.length).toBeGreaterThan(50);
      });
    });

    describe("new features list (PR changes)", () => {
      it("should list 'Keyboard Protection' as a feature", () => {
        expect(readme).toContain("Keyboard Protection");
      });

      it("Keyboard Protection should describe suppressing terminal input during deletion", () => {
        const kbSection = readme.substring(
          readme.indexOf("Keyboard Protection"),
          readme.indexOf("Keyboard Protection") + 200,
        );
        expect(kbSection).toContain("suppressed");
      });

      it("should list 'Build Analysis' as a feature", () => {
        expect(readme).toContain("Build Analysis");
      });

      it("Build Analysis should mention --build-analysis flag", () => {
        const buildAnalysisSection = readme.substring(
          readme.indexOf("**Build Analysis:**"),
          readme.indexOf("**Build Analysis:**") + 150,
        );
        expect(buildAnalysisSection).toContain("--build-analysis");
      });

      it("should list 'Include Patterns' as a feature", () => {
        expect(readme).toContain("Include Patterns");
      });

      it("Include Patterns should mention --include flag", () => {
        const includeSection = readme.substring(
          readme.indexOf("**Include Patterns:**"),
          readme.indexOf("**Include Patterns:**") + 150,
        );
        expect(includeSection).toContain("--include");
      });

      it("should list 'Global Config' as a feature", () => {
        expect(readme).toContain("Global Config");
      });

      it("Global Config should mention --save flag", () => {
        const globalConfigSection = readme.substring(
          readme.indexOf("**Global Config:**"),
          readme.indexOf("**Global Config:**") + 150,
        );
        expect(globalConfigSection).toContain("--save");
      });
    });

    describe("detected items list (PR changes)", () => {
      it("should NOT list .pnpm-store in Build/Cache Folders", () => {
        const buildSection = readme.substring(
          readme.indexOf("**Build/Cache Folders**"),
          readme.indexOf("**Testing/Reporting Folders**"),
        );
        expect(buildSection).not.toContain(".pnpm-store");
      });

      it("should still list .nx in Build/Cache Folders", () => {
        const buildSection = readme.substring(
          readme.indexOf("**Build/Cache Folders**"),
          readme.indexOf("**Testing/Reporting Folders**"),
        );
        expect(buildSection).toContain(".nx");
      });

      it("Testing/Reporting Folders should have its own line", () => {
        // The PR fixed a formatting bug where the items were on the same line as the header
        const testingIndex = readme.indexOf("**Testing/Reporting Folders**");
        const nextLineStart = readme.indexOf("\n", testingIndex) + 1;
        const nextLine = readme.substring(nextLineStart, readme.indexOf("\n", nextLineStart));
        // Next line should be a list item starting with spaces/dashes, not inline content
        expect(nextLine.trim()).toMatch(/^-\s+`coverage`/);
      });
    });

    describe("edge cases", () => {
      it("should be non-empty", () => {
        expect(readme.length).toBeGreaterThan(0);
      });

      it("should have multiple lines", () => {
        expect(readme.split("\n").length).toBeGreaterThan(50);
      });

      it("should contain the --save flag documented correctly", () => {
        expect(readme).toContain("--save");
        expect(readme).toContain("-s");
      });

      it("should mention .reclaimspacerc in multiple contexts", () => {
        const mentions = (readme.match(/\.reclaimspacerc/g) || []).length;
        expect(mentions).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe("docs/index.html", () => {
    const htmlPath = path.join(process.cwd(), "docs", "index.html");
    let html;

    beforeAll(() => {
      html = fs.readFileSync(htmlPath, "utf8");
    });

    it("should exist", () => {
      expect(fs.existsSync(htmlPath)).toBe(true);
    });

    describe("global config paths (PR changes)", () => {
      it("should have heading 'Ignore Certain Folders Permanently (Global)'", () => {
        expect(html).toContain("Ignore Certain Folders Permanently (Global)");
      });

      it("should not have the old heading without '(Global)'", () => {
        // The old heading was "Ignore Certain Folders Permanently" without (Global)
        // Now it must have (Global) in it
        expect(html).toContain("(Global)");
      });

      it("should document %APPDATA% path for Windows", () => {
        expect(html).toContain("%APPDATA%");
      });

      it("should document ~/Library/Application Support path for macOS", () => {
        expect(html).toContain("~/Library/Application Support/reclaimspace/");
      });

      it("should document ~/.config path for Linux", () => {
        expect(html).toContain("~/.config/reclaimspace/");
      });

      it("should label the Windows path clearly", () => {
        const windowsSection = html.substring(
          html.indexOf("%APPDATA%") - 200,
          html.indexOf("%APPDATA%") + 100,
        );
        expect(windowsSection).toContain("Windows");
      });

      it("should label the macOS path clearly", () => {
        const macSection = html.substring(
          html.indexOf("Application Support") - 200,
          html.indexOf("Application Support") + 100,
        );
        expect(macSection).toContain("macOS");
      });

      it("should label the Linux path clearly", () => {
        const linuxSection = html.substring(
          html.indexOf("~/.config/reclaimspace/") - 200,
          html.indexOf("~/.config/reclaimspace/") + 100,
        );
        expect(linuxSection).toContain("Linux");
      });
    });

    describe("configuration sections (PR changes)", () => {
      it("should have a 'Per-Project Ignore Patterns' section", () => {
        expect(html).toContain("Per-Project Ignore Patterns");
      });

      it("should have a 'Global Ignore Patterns' section", () => {
        expect(html).toContain("Global Ignore Patterns");
      });

      it("should have a 'Default Ignore Patterns' section", () => {
        expect(html).toContain("Default Ignore Patterns");
      });

      it("Default Ignore Patterns should document System directories", () => {
        const defaultSection = html.substring(
          html.indexOf("Default Ignore Patterns"),
        );
        expect(defaultSection).toContain("Program Files");
        expect(defaultSection).toContain("Applications");
      });

      it("Default Ignore Patterns should document Editor/IDE directories", () => {
        const defaultSection = html.substring(
          html.indexOf("Default Ignore Patterns"),
        );
        expect(defaultSection).toContain(".vscode");
        expect(defaultSection).toContain(".cursor");
        expect(defaultSection).toContain(".idea");
      });

      it("Default Ignore Patterns should document Package Manager directories", () => {
        const defaultSection = html.substring(
          html.indexOf("Default Ignore Patterns"),
        );
        expect(defaultSection).toContain(".pnpm-store");
      });

      it("Global Ignore Patterns section should document --ignore with --save usage", () => {
        const globalSection = html.substring(
          html.indexOf("Global Ignore Patterns"),
          html.indexOf("Default Ignore Patterns"),
        );
        expect(globalSection).toContain("--ignore");
        expect(globalSection).toContain("--save");
      });
    });

    describe("new features (PR changes)", () => {
      it("should list 'Keyboard Protection' as a feature", () => {
        expect(html).toContain("Keyboard Protection");
      });

      it("Keyboard Protection feature should describe suppressing terminal input", () => {
        const kbSection = html.substring(
          html.indexOf("Keyboard Protection"),
          html.indexOf("Keyboard Protection") + 300,
        );
        expect(kbSection).toContain("suppressed");
      });

      it("should list 'Build Analysis' as a feature", () => {
        expect(html).toContain("Build Analysis");
      });

      it("Build Analysis feature should mention --build-analysis flag", () => {
        const buildAnalysisSection = html.substring(
          html.indexOf("Build Analysis:"),
          html.indexOf("Build Analysis:") + 200,
        );
        expect(buildAnalysisSection).toContain("--build-analysis");
      });

      it("should list 'Include Patterns' as a feature", () => {
        expect(html).toContain("Include Patterns");
      });

      it("Include Patterns feature should mention --include flag", () => {
        const includeSection = html.substring(
          html.indexOf("Include Patterns:"),
          html.indexOf("Include Patterns:") + 200,
        );
        expect(includeSection).toContain("--include");
      });

      it("should list 'Global Config' as a feature", () => {
        expect(html).toContain("Global Config");
      });

      it("Global Config feature should mention --save flag", () => {
        const globalConfigSection = html.substring(
          html.indexOf("Global Config:"),
          html.indexOf("Global Config:") + 200,
        );
        expect(globalConfigSection).toContain("--save");
      });
    });

    describe("detected items (PR changes)", () => {
      it("should NOT include .pnpm-store in Build/Cache Folders detected items", () => {
        const detectedSection = html.substring(
          html.indexOf("Build/Cache Folders"),
          html.indexOf("Testing/Reporting Folders"),
        );
        expect(detectedSection).not.toContain(".pnpm-store");
      });

      it("should still list .nx in Build/Cache Folders", () => {
        const detectedSection = html.substring(
          html.indexOf("Build/Cache Folders"),
          html.indexOf("Testing/Reporting Folders"),
        );
        expect(detectedSection).toContain(".nx");
      });

      it("should list .wwebjs_cache and .wwebjs_auth in Build/Cache Folders", () => {
        const detectedSection = html.substring(
          html.indexOf("Build/Cache Folders"),
          html.indexOf("Testing/Reporting Folders"),
        );
        expect(detectedSection).toContain(".wwebjs_cache");
        expect(detectedSection).toContain(".wwebjs_auth");
      });
    });

    describe("HTML structure", () => {
      it("should be valid HTML with proper structure", () => {
        expect(html).toContain("<html");
        expect(html).toContain("</html>");
        expect(html).toContain("<head>");
        expect(html).toContain("<body");
      });

      it("should have a configuration section", () => {
        expect(html).toContain('id="configuration"');
      });

      it("should have a features section", () => {
        expect(html).toContain('id="features"');
      });

      it("should have a detected-items section", () => {
        expect(html).toContain('id="detected-items"');
      });

      it("should not be empty", () => {
        expect(html.length).toBeGreaterThan(1000);
      });
    });

    describe("consistency between README.md and docs/index.html", () => {
      const readmePath = path.join(process.cwd(), "README.md");

      it("both should document the same Windows config path", () => {
        const readme = fs.readFileSync(readmePath, "utf8");
        expect(readme).toContain("%APPDATA%");
        expect(html).toContain("%APPDATA%");
      });

      it("both should document the same macOS config path", () => {
        const readme = fs.readFileSync(readmePath, "utf8");
        expect(readme).toContain("~/Library/Application Support/reclaimspace/");
        expect(html).toContain("~/Library/Application Support/reclaimspace/");
      });

      it("both should document the same Linux config path", () => {
        const readme = fs.readFileSync(readmePath, "utf8");
        expect(readme).toContain("~/.config/reclaimspace/");
        expect(html).toContain("~/.config/reclaimspace/");
      });

      it("both should document the Keyboard Protection feature", () => {
        const readme = fs.readFileSync(readmePath, "utf8");
        expect(readme).toContain("Keyboard Protection");
        expect(html).toContain("Keyboard Protection");
      });

      it("both should document the Global Config feature", () => {
        const readme = fs.readFileSync(readmePath, "utf8");
        expect(readme).toContain("Global Config");
        expect(html).toContain("Global Config");
      });

      it("neither should list .pnpm-store in Build/Cache Folders detected items", () => {
        const readme = fs.readFileSync(readmePath, "utf8");
        const readmeBuildSection = readme.substring(
          readme.indexOf("**Build/Cache Folders**"),
          readme.indexOf("**Testing/Reporting Folders**"),
        );
        const htmlBuildSection = html.substring(
          html.indexOf("Build/Cache Folders"),
          html.indexOf("Testing/Reporting Folders"),
        );
        expect(readmeBuildSection).not.toContain(".pnpm-store");
        expect(htmlBuildSection).not.toContain(".pnpm-store");
      });
    });
  });
});