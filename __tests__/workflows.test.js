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

    it("should trigger on push to main", () => {
      expect(buildWorkflow).toContain("push:");
      expect(buildWorkflow).toContain("- main");
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

    it("should have a report-status job", () => {
      expect(buildWorkflow).toContain("report-status:");
    });

    it("report-status job should run with gated always() condition", () => {
      const reportBlock = buildWorkflow.substring(buildWorkflow.indexOf("report-status:"));
      expect(reportBlock).toMatch(/always\(\)/);
      expect(reportBlock).toMatch(/safe-to-test/);
    });

    it("report-status job should depend on the build job", () => {
      const reportBlock = buildWorkflow.substring(buildWorkflow.indexOf("report-status:"));
      expect(reportBlock).toMatch(/needs:\s*\[?build\]?/);
    });

    it("report-status job should call reporter.yml", () => {
      expect(buildWorkflow).toContain("uses: ./.github/workflows/reporter.yml");
    });

    it("report-status job should pass workflow_name as 'Build'", () => {
      const reportBlock = buildWorkflow.substring(buildWorkflow.indexOf("report-status:"));
      expect(reportBlock).toContain('workflow_name: "Build"');
    });

    it("report-status job should pass conclusion from build result", () => {
      const reportBlock = buildWorkflow.substring(buildWorkflow.indexOf("report-status:"));
      expect(reportBlock).toContain("conclusion: $" + "{{ needs.build.result }}");
    });

    it("report-status job should have pull-requests write permission", () => {
      const reportBlock = buildWorkflow.substring(buildWorkflow.indexOf("report-status:"));
      expect(reportBlock).toContain("pull-requests: write");
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

  describe("lint.yml (new file)", () => {
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

    it("should trigger on push to main", () => {
      expect(lintWorkflow).toContain("push:");
      expect(lintWorkflow).toContain("- main");
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

    it("should have a report-status job", () => {
      expect(lintWorkflow).toContain("report-status:");
    });

    it("report-status job should run with gated always() condition", () => {
      const reportBlock = lintWorkflow.substring(lintWorkflow.indexOf("report-status:"));
      expect(reportBlock).toMatch(/always\(\)/);
      expect(reportBlock).toMatch(/safe-to-test/);
    });

    it("report-status job should depend on the lint job", () => {
      const reportBlock = lintWorkflow.substring(lintWorkflow.indexOf("report-status:"));
      expect(reportBlock).toMatch(/needs:\s*\[?lint\]?/);
    });

    it("report-status job should call reporter.yml", () => {
      expect(lintWorkflow).toContain("uses: ./.github/workflows/reporter.yml");
    });

    it("report-status job should pass workflow_name as 'Lint'", () => {
      const reportBlock = lintWorkflow.substring(lintWorkflow.indexOf("report-status:"));
      expect(reportBlock).toContain('workflow_name: "Lint"');
    });

    it("report-status job should pass conclusion from lint result", () => {
      const reportBlock = lintWorkflow.substring(lintWorkflow.indexOf("report-status:"));
      expect(reportBlock).toContain("conclusion: $" + "{{ needs.lint.result }}");
    });

    it("report-status job should have pull-requests write permission", () => {
      const reportBlock = lintWorkflow.substring(lintWorkflow.indexOf("report-status:"));
      expect(reportBlock).toContain("pull-requests: write");
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

  describe("reporter.yml (new file)", () => {
    const reporterPath = path.join(workflowsDir, "reporter.yml");
    let reporter;

    beforeAll(() => {
      reporter = fs.readFileSync(reporterPath, "utf8");
    });

    it("should exist", () => {
      expect(fs.existsSync(reporterPath)).toBe(true);
    });

    it("should be named 'Status Reporter'", () => {
      expect(reporter).toMatch(/^name:\s*Status Reporter\s*$/m);
    });

    it("should be a reusable workflow (workflow_call)", () => {
      expect(reporter).toContain("workflow_call:");
    });

    it("should require workflow_name input", () => {
      expect(reporter).toContain("workflow_name:");
      const inputBlock = reporter.substring(reporter.indexOf("workflow_name:"));
      expect(inputBlock).toContain("required: true");
    });

    it("workflow_name input should be of type string", () => {
      const inputBlock = reporter.substring(
        reporter.indexOf("workflow_name:"),
        reporter.indexOf("conclusion:"),
      );
      expect(inputBlock).toContain("type: string");
    });

    it("should require conclusion input", () => {
      const conclusionBlock = reporter.substring(reporter.indexOf("conclusion:"));
      expect(conclusionBlock).toContain("required: true");
    });

    it("conclusion input should be of type string", () => {
      const conclusionBlock = reporter.substring(
        reporter.indexOf("conclusion:"),
        reporter.indexOf("run_id:"),
      );
      expect(conclusionBlock).toContain("type: string");
    });

    it("should require run_id input", () => {
      const runIdBlock = reporter.substring(reporter.indexOf("run_id:"));
      expect(runIdBlock).toContain("required: true");
    });

    it("run_id input should be of type string", () => {
      const runIdBlock = reporter.substring(
        reporter.indexOf("run_id:"),
        reporter.indexOf("permissions:"),
      );
      expect(runIdBlock).toContain("type: string");
    });

    it("should have pull-requests write permission", () => {
      expect(reporter).toContain("pull-requests: write");
    });

    it("should have contents read permission", () => {
      expect(reporter).toContain("contents: read");
    });

    it("should have a report job", () => {
      expect(reporter).toContain("report:");
    });

    it("should use github-script action", () => {
      expect(reporter).toContain("actions/github-script@v7");
    });

    it("should use ci-status-reporter marker for comment identification", () => {
      expect(reporter).toContain("<!-- ci-status-reporter -->");
    });

    it("should build a table row with status, workflow name, result, and details", () => {
      expect(reporter).toContain("| Status | Workflow | Result | Details |");
    });

    it("should map success conclusion to checkmark emoji", () => {
      expect(reporter).toContain("conclusion === 'success' ? '✅'");
    });

    it("should map failure conclusion to cross emoji", () => {
      expect(reporter).toContain("conclusion === 'failure' ? '❌'");
    });

    it("should map cancelled conclusion to stop emoji", () => {
      expect(reporter).toContain("conclusion === 'cancelled' ? '⏹️'");
    });

    it("should map skipped conclusion to skip emoji", () => {
      expect(reporter).toContain("conclusion === 'skipped' ? '⏭️'");
    });

    it("should find open PRs for the current branch", () => {
      expect(reporter).toContain("pulls.list");
      expect(reporter).toContain("state: 'open'");
    });

    it("should update existing comment when bot comment found", () => {
      expect(reporter).toContain("updateComment");
    });

    it("should create new comment when no bot comment found", () => {
      expect(reporter).toContain("createComment");
    });

    it("should keep rows from other workflows when updating existing comment", () => {
      expect(reporter).toContain("keptRows");
    });

    it("should use workflow name as row key for deduplication", () => {
      expect(reporter).toContain("rowKey");
    });

    it("should sort rows when updating comment", () => {
      expect(reporter).toContain(".sort()");
    });

    it("should log informational messages via core.info", () => {
      expect(reporter).toContain("core.info");
    });

    it("should build run URL from server URL and repo", () => {
      expect(reporter).toContain("serverUrl");
      expect(reporter).toContain("actions/runs");
    });

    it("should not have syntax errors (no tabs)", () => {
      expect(reporter).not.toMatch(/\t/);
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

    it("both should trigger on push and pull_request to main", () => {
      const buildContent = fs.readFileSync(buildPath, "utf8");
      const lintContent = fs.readFileSync(lintPath, "utf8");

      expect(buildContent).toContain("push:");
      expect(buildContent).toContain("pull_request:");
      expect(lintContent).toContain("push:");
      expect(lintContent).toContain("pull_request:");
    });

    it("both should use actions/checkout@v4", () => {
      const buildContent = fs.readFileSync(buildPath, "utf8");
      const lintContent = fs.readFileSync(lintPath, "utf8");

      expect(buildContent).toContain("actions/checkout@v4");
      expect(lintContent).toContain("actions/checkout@v4");
    });

    it("both should reference reporter.yml for status reporting", () => {
      const buildContent = fs.readFileSync(buildPath, "utf8");
      const lintContent = fs.readFileSync(lintPath, "utf8");

      expect(buildContent).toContain("uses: ./.github/workflows/reporter.yml");
      expect(lintContent).toContain("uses: ./.github/workflows/reporter.yml");
    });

    it("both report-status jobs should include always() and safe-to-test gating", () => {
      const buildContent = fs.readFileSync(buildPath, "utf8");
      const lintContent = fs.readFileSync(lintPath, "utf8");

      const buildReportBlock = buildContent.substring(buildContent.indexOf("report-status:"));
      const lintReportBlock = lintContent.substring(lintContent.indexOf("report-status:"));

      expect(buildReportBlock).toMatch(/always\(\)/);
      expect(buildReportBlock).toMatch(/safe-to-test/);
      expect(lintReportBlock).toMatch(/always\(\)/);
      expect(lintReportBlock).toMatch(/safe-to-test/);
    });
  });
});
