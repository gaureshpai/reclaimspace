import fs from "node:fs";
import path from "node:path";

describe("GitHub Actions Workflows", () => {
  const workflowsDir = path.join(process.cwd(), ".github", "workflows");

  describe("build.yml", () => {
    const buildWorkflowPath = path.join(workflowsDir, "build.yml");
    let buildWorkflow;

    beforeAll(() => {
      buildWorkflow = fs.readFileSync(buildWorkflowPath, "utf8");
    });

    it("should exist", () => {
      expect(fs.existsSync(buildWorkflowPath)).toBe(true);
    });

    it("should be named 'Build'", () => {
      expect(buildWorkflow).toMatch(/^name:\s*Build\s*$/m);
    });

    it("should not be named 'CI' (renamed from ci.yml)", () => {
      expect(buildWorkflow).not.toMatch(/^name:\s*CI\s*$/m);
    });

    it("should not trigger on push to main (only pull_request)", () => {
      expect(buildWorkflow).not.toContain("push:");
    });

    it("should trigger on pull_request to main", () => {
      expect(buildWorkflow).toContain("pull_request:");
    });

    it("should use pnpm version 10", () => {
      expect(buildWorkflow).toMatch(/version:\s*10/);
    });

    it("should not use pnpm version 9", () => {
      expect(buildWorkflow).not.toMatch(/version:\s*9\b/);
    });

    it("should use Node.js version 20", () => {
      expect(buildWorkflow).toMatch(/node-version:\s*["']?20["']?/);
    });

    it("should install dependencies", () => {
      expect(buildWorkflow).toContain("pnpm install");
      expect(buildWorkflow).not.toContain("--frozen-lockfile");
    });

    it("should have a 'Verify package' step using pnpm pack --dry-run", () => {
      expect(buildWorkflow).toContain("Verify package");
      expect(buildWorkflow).toContain("pnpm pack --dry-run");
    });

    it("should not have the old test step that ran pnpm test", () => {
      expect(buildWorkflow).not.toContain("Run tests");
      expect(buildWorkflow).not.toMatch(/pnpm test\b/);
    });

    it("should not upload test logs artifact", () => {
      expect(buildWorkflow).not.toContain("Upload test logs");
      expect(buildWorkflow).not.toContain("test-logs");
    });

    it("should checkout code", () => {
      expect(buildWorkflow).toContain("actions/checkout@v4");
    });

    it("should cache pnpm store", () => {
      expect(buildWorkflow).toContain('cache: "pnpm"');
    });

    it("should not have syntax errors (no tabs)", () => {
      expect(buildWorkflow).not.toMatch(/\t/);
    });
  });

  describe("lint.yml", () => {
    const lintWorkflowPath = path.join(workflowsDir, "lint.yml");
    let lintWorkflow;

    beforeAll(() => {
      lintWorkflow = fs.readFileSync(lintWorkflowPath, "utf8");
    });

    it("should exist", () => {
      expect(fs.existsSync(lintWorkflowPath)).toBe(true);
    });

    it("should be named 'Lint'", () => {
      expect(lintWorkflow).toMatch(/^name:\s*Lint\s*$/m);
    });

    it("should not trigger on push to main (only pull_request)", () => {
      expect(lintWorkflow).not.toContain("push:");
    });

    it("should trigger on pull_request to main", () => {
      expect(lintWorkflow).toContain("pull_request:");
    });

    it("should use pnpm version 10", () => {
      expect(lintWorkflow).toMatch(/version:\s*10/);
    });

    it("should use Node.js version 20", () => {
      expect(lintWorkflow).toMatch(/node-version:\s*["']?20["']?/);
    });

    it("should install dependencies", () => {
      expect(lintWorkflow).toContain("pnpm install");
      expect(lintWorkflow).not.toContain("--frozen-lockfile");
    });

    it("should run Biome lint via pnpm lint", () => {
      expect(lintWorkflow).toContain("Run Biome lint");
      expect(lintWorkflow).toContain("pnpm lint");
    });

    it("should have a lint job", () => {
      expect(lintWorkflow).toContain("lint:");
    });

    it("lint job should run on ubuntu-latest", () => {
      expect(lintWorkflow).toContain("runs-on: ubuntu-latest");
    });

    it("should checkout code", () => {
      expect(lintWorkflow).toContain("actions/checkout@v4");
    });

    it("should cache pnpm store", () => {
      expect(lintWorkflow).toContain('cache: "pnpm"');
    });

    it("should not have syntax errors (no tabs)", () => {
      expect(lintWorkflow).not.toMatch(/\t/);
    });
  });

  describe("post-test-results.yml", () => {
    const postTestPath = path.join(workflowsDir, "post-test-results.yml");
    let postTest;

    beforeAll(() => {
      postTest = fs.readFileSync(postTestPath, "utf8");
    });

    it("should exist", () => {
      expect(fs.existsSync(postTestPath)).toBe(true);
    });

    it("should trigger on workflow_run for Lint, Test, and Build", () => {
      expect(postTest).toContain("workflow_run:");
      expect(postTest).toContain("Lint");
      expect(postTest).toContain("Test");
      expect(postTest).toContain("Build");
    });

    it("should not trigger only on CI workflow (old behavior)", () => {
      // Should not have the old single-workflow trigger
      expect(postTest).not.toMatch(/workflows:\s*\[["']CI["']\]/);
    });

    it("should trigger on completed workflow runs", () => {
      expect(postTest).toContain("types: [completed]");
    });

    it("should have pull-requests write permission", () => {
      expect(postTest).toContain("pull-requests: write");
    });

    it("should have actions read permission", () => {
      expect(postTest).toContain("actions: read");
    });

    it("should have aggregate-report job", () => {
      expect(postTest).toContain("aggregate-report:");
    });

    it("should not have old job name comment-on-pr", () => {
      expect(postTest).not.toContain("comment-on-pr:");
    });

    it("should track all 3 workflows in the script", () => {
      expect(postTest).toContain("'Lint'");
      expect(postTest).toContain("'Test'");
      expect(postTest).toContain("'Build'");
    });

    it("should fetch check runs for the commit SHA", () => {
      expect(postTest).toContain("checks.listForRef");
    });

    it("should have fallback to listWorkflowRuns", () => {
      expect(postTest).toContain("actions.listWorkflowRuns");
    });

    it("should compute allCompleted status", () => {
      expect(postTest).toContain("allCompleted");
    });

    it("should compute allSuccess status", () => {
      expect(postTest).toContain("allSuccess");
    });

    it("should compute anyFailure status", () => {
      expect(postTest).toContain("anyFailure");
    });

    it("should handle timed_out conclusion", () => {
      expect(postTest).toContain("timed_out");
    });

    it("should use HTML table format for status", () => {
      expect(postTest).toContain("| Status | Workflow | Result |");
    });

    it("should use ci-cd-test-results marker for comment identification", () => {
      expect(postTest).toContain("<!-- ci-cd-test-results -->");
    });

    it("should update or create a PR comment", () => {
      expect(postTest).toContain("updateComment");
      expect(postTest).toContain("createComment");
    });

    it("should look for github-actions[bot] as comment author", () => {
      expect(postTest).toContain("github-actions[bot]");
    });

    it("should reference the triggering workflow by name", () => {
      expect(postTest).toContain("triggerRun.name");
    });

    it("should use github-script action", () => {
      expect(postTest).toContain("actions/github-script@v7");
    });

    it("should not have syntax errors (no tabs)", () => {
      expect(postTest).not.toMatch(/\t/);
    });
  });

  describe("workflow consistency across build.yml and lint.yml", () => {
    const buildPath = path.join(workflowsDir, "build.yml");
    const lintPath = path.join(workflowsDir, "lint.yml");

    it("both should use the same pnpm version", () => {
      const buildContent = fs.readFileSync(buildPath, "utf8");
      const lintContent = fs.readFileSync(lintPath, "utf8");

      const buildPnpmVersion = buildContent.match(/version:\s*(\d+)/)?.[1];
      const lintPnpmVersion = lintContent.match(/version:\s*(\d+)/)?.[1];

      expect(buildPnpmVersion).toBe("10");
      expect(lintPnpmVersion).toBe("10");
    });

    it("both should use the same Node.js version", () => {
      const buildContent = fs.readFileSync(buildPath, "utf8");
      const lintContent = fs.readFileSync(lintPath, "utf8");

      const buildNodeVersion = buildContent.match(/node-version:\s*["']?(\d+)["']?/)?.[1];
      const lintNodeVersion = lintContent.match(/node-version:\s*["']?(\d+)["']?/)?.[1];

      expect(buildNodeVersion).toBe("20");
      expect(lintNodeVersion).toBe("20");
    });

    it("both should trigger on pull_request to main only (not push)", () => {
      const buildContent = fs.readFileSync(buildPath, "utf8");
      const lintContent = fs.readFileSync(lintPath, "utf8");

      expect(buildContent).toContain("pull_request:");
      expect(lintContent).toContain("pull_request:");
      expect(buildContent).not.toContain("push:");
      expect(lintContent).not.toContain("push:");
    });

    it("both should use actions/checkout@v4", () => {
      const buildContent = fs.readFileSync(buildPath, "utf8");
      const lintContent = fs.readFileSync(lintPath, "utf8");

      expect(buildContent).toContain("actions/checkout@v4");
      expect(lintContent).toContain("actions/checkout@v4");
    });
  });
});
