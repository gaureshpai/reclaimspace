import fs from "node:fs";
import path from "node:path";

describe("GitHub Workflows", () => {
  const workflowsDir = path.join(process.cwd(), ".github", "workflows");

  // ─── Shared helpers ────────────────────────────────────────────────────────

  function readWorkflow(name) {
    return fs.readFileSync(path.join(workflowsDir, name), "utf8");
  }

  function workflowExists(name) {
    return fs.existsSync(path.join(workflowsDir, name));
  }

  // ─── build.yml ─────────────────────────────────────────────────────────────

  describe("build.yml", () => {
    let content;

    beforeAll(() => {
      content = readWorkflow("build.yml");
    });

    it("should exist", () => {
      expect(workflowExists("build.yml")).toBe(true);
    });

    it("should be readable without errors", () => {
      expect(() => readWorkflow("build.yml")).not.toThrow();
    });

    it("should have workflow name 'Build'", () => {
      expect(content).toMatch(/^name:\s*Build\s*$/m);
    });

    it("should trigger on push to main branch", () => {
      expect(content).toContain("push:");
      expect(content).toMatch(/branches:\s*\n\s*-\s*main/);
    });

    it("should trigger on pull_request with labeled type", () => {
      expect(content).toContain("pull_request:");
      expect(content).toMatch(/types:\s*\[labeled\]/);
    });

    it("should trigger on workflow_dispatch", () => {
      expect(content).toContain("workflow_dispatch:");
    });

    it("should gate the build job on safe-to-test label for PRs", () => {
      expect(content).toContain("safe-to-test");
      expect(content).toMatch(/contains\(github\.event\.pull_request\.labels\.\*\.name,\s*['"]safe-to-test['"]\)/);
    });

    it("should use pnpm version 10", () => {
      expect(content).toMatch(/version:\s*10/);
    });

    it("should use Node.js version 20", () => {
      expect(content).toMatch(/node-version:\s*["']?20["']?/);
    });

    it("should run pnpm install --frozen-lockfile", () => {
      expect(content).toContain("pnpm install --frozen-lockfile");
    });

    it("should verify the package with pnpm pack --dry-run", () => {
      expect(content).toContain("pnpm pack --dry-run");
    });

    it("should have a report-status job", () => {
      expect(content).toContain("report-status:");
    });

    it("report-status job should call reporter.yml", () => {
      expect(content).toContain("./.github/workflows/reporter.yml");
    });

    it("report-status should pass workflow_name as 'Build'", () => {
      expect(content).toMatch(/workflow_name:\s*["']Build["']/);
    });

    it("report-status should pass the build job result as conclusion", () => {
      expect(content).toMatch(/conclusion:\s*\$\{\{.*needs\.build\.result.*\}\}/);
    });

    it("report-status should have pull-requests write permission", () => {
      expect(content).toContain("pull-requests: write");
    });

    it("report-status should always run even when build fails", () => {
      expect(content).toMatch(/if:\s*\$\{\{.*always\(\)/);
    });

    it("should not contain tabs (YAML uses spaces)", () => {
      expect(content).not.toMatch(/\t/);
    });
  });

  // ─── lint.yml ──────────────────────────────────────────────────────────────

  describe("lint.yml", () => {
    let content;

    beforeAll(() => {
      content = readWorkflow("lint.yml");
    });

    it("should exist", () => {
      expect(workflowExists("lint.yml")).toBe(true);
    });

    it("should be readable without errors", () => {
      expect(() => readWorkflow("lint.yml")).not.toThrow();
    });

    it("should have workflow name 'Lint'", () => {
      expect(content).toMatch(/^name:\s*Lint\s*$/m);
    });

    it("should trigger on push to main branch", () => {
      expect(content).toContain("push:");
      expect(content).toMatch(/branches:\s*\n\s*-\s*main/);
    });

    it("should trigger on pull_request with labeled type", () => {
      expect(content).toContain("pull_request:");
      expect(content).toMatch(/types:\s*\[labeled\]/);
    });

    it("should trigger on workflow_dispatch", () => {
      expect(content).toContain("workflow_dispatch:");
    });

    it("should gate the lint job on safe-to-test label for PRs", () => {
      expect(content).toContain("safe-to-test");
      expect(content).toMatch(/contains\(github\.event\.pull_request\.labels\.\*\.name,\s*['"]safe-to-test['"]\)/);
    });

    it("should use pnpm version 10", () => {
      expect(content).toMatch(/version:\s*10/);
    });

    it("should use Node.js version 20", () => {
      expect(content).toMatch(/node-version:\s*["']?20["']?/);
    });

    it("should run pnpm install --frozen-lockfile", () => {
      expect(content).toContain("pnpm install --frozen-lockfile");
    });

    it("should run pnpm lint", () => {
      expect(content).toContain("pnpm lint");
    });

    it("should have a report-status job", () => {
      expect(content).toContain("report-status:");
    });

    it("report-status job should call reporter.yml", () => {
      expect(content).toContain("./.github/workflows/reporter.yml");
    });

    it("report-status should pass workflow_name as 'Lint'", () => {
      expect(content).toMatch(/workflow_name:\s*["']Lint["']/);
    });

    it("report-status should pass the lint job result as conclusion", () => {
      expect(content).toMatch(/conclusion:\s*\$\{\{.*needs\.lint\.result.*\}\}/);
    });

    it("report-status should always run even when lint fails", () => {
      expect(content).toMatch(/if:\s*\$\{\{.*always\(\)/);
    });

    it("should not contain tabs (YAML uses spaces)", () => {
      expect(content).not.toMatch(/\t/);
    });
  });

  // ─── test.yml ──────────────────────────────────────────────────────────────

  describe("test.yml", () => {
    let content;

    beforeAll(() => {
      content = readWorkflow("test.yml");
    });

    it("should exist", () => {
      expect(workflowExists("test.yml")).toBe(true);
    });

    it("should be readable without errors", () => {
      expect(() => readWorkflow("test.yml")).not.toThrow();
    });

    it("should have workflow name 'Test'", () => {
      expect(content).toMatch(/^name:\s*Test\s*$/m);
    });

    it("should trigger on push to main branch", () => {
      expect(content).toContain("push:");
      expect(content).toMatch(/branches:\s*\n\s*-\s*main/);
    });

    it("should trigger on pull_request with labeled type", () => {
      expect(content).toContain("pull_request:");
      expect(content).toMatch(/types:\s*\[labeled\]/);
    });

    it("should trigger on workflow_dispatch", () => {
      expect(content).toContain("workflow_dispatch:");
    });

    it("should gate the test job on safe-to-test label for PRs", () => {
      expect(content).toContain("safe-to-test");
      expect(content).toMatch(/contains\(github\.event\.pull_request\.labels\.\*\.name,\s*['"]safe-to-test['"]\)/);
    });

    it("should use pnpm version 10", () => {
      expect(content).toMatch(/version:\s*10/);
    });

    it("should use Node.js version 20", () => {
      expect(content).toMatch(/node-version:\s*["']?20["']?/);
    });

    it("should run pnpm install --frozen-lockfile", () => {
      expect(content).toContain("pnpm install --frozen-lockfile");
    });

    it("should run pnpm test", () => {
      expect(content).toContain("pnpm test");
    });

    it("should have a report-status job", () => {
      expect(content).toContain("report-status:");
    });

    it("report-status job should call reporter.yml", () => {
      expect(content).toContain("./.github/workflows/reporter.yml");
    });

    it("report-status should pass workflow_name as 'Test'", () => {
      expect(content).toMatch(/workflow_name:\s*["']Test["']/);
    });

    it("report-status should pass the test job result as conclusion", () => {
      expect(content).toMatch(/conclusion:\s*\$\{\{.*needs\.test\.result.*\}\}/);
    });

    it("report-status should always run even when tests fail", () => {
      expect(content).toMatch(/if:\s*\$\{\{.*always\(\)/);
    });

    it("should not contain tabs (YAML uses spaces)", () => {
      expect(content).not.toMatch(/\t/);
    });
  });

  // ─── reporter.yml ──────────────────────────────────────────────────────────

  describe("reporter.yml", () => {
    let content;

    beforeAll(() => {
      content = readWorkflow("reporter.yml");
    });

    it("should exist", () => {
      expect(workflowExists("reporter.yml")).toBe(true);
    });

    it("should be readable without errors", () => {
      expect(() => readWorkflow("reporter.yml")).not.toThrow();
    });

    it("should have workflow name 'Status Reporter'", () => {
      expect(content).toMatch(/^name:\s*Status Reporter\s*$/m);
    });

    it("should be triggered via workflow_call", () => {
      expect(content).toContain("workflow_call:");
    });

    it("should declare workflow_name as a required string input", () => {
      expect(content).toContain("workflow_name:");
      expect(content).toMatch(/workflow_name:\s*\n\s+required:\s*true/);
      expect(content).toMatch(/workflow_name:\s*\n\s+required:\s*true\s*\n\s+type:\s*string/);
    });

    it("should declare conclusion as a required string input", () => {
      expect(content).toContain("conclusion:");
      expect(content).toMatch(/conclusion:\s*\n\s+required:\s*true/);
    });

    it("should declare run_id as a required string input", () => {
      expect(content).toContain("run_id:");
      expect(content).toMatch(/run_id:\s*\n\s+required:\s*true/);
    });

    it("should have pull-requests write permission", () => {
      expect(content).toContain("pull-requests: write");
    });

    it("should have contents read permission", () => {
      expect(content).toContain("contents: read");
    });

    it("should use the github-script action", () => {
      expect(content).toContain("actions/github-script");
    });

    it("should include the ci-status-reporter marker comment", () => {
      expect(content).toContain("<!-- ci-status-reporter -->");
    });

    it("should map success conclusion to ✅ emoji", () => {
      expect(content).toContain("success");
      expect(content).toContain("✅");
    });

    it("should map failure conclusion to ❌ emoji", () => {
      expect(content).toContain("failure");
      expect(content).toContain("❌");
    });

    it("should map cancelled conclusion to ⏹️ emoji", () => {
      expect(content).toContain("cancelled");
      expect(content).toContain("⏹️");
    });

    it("should map skipped conclusion to ⏭️ emoji", () => {
      expect(content).toContain("skipped");
      expect(content).toContain("⏭️");
    });

    it("should create a PR comment if none exists", () => {
      expect(content).toContain("createComment");
    });

    it("should update an existing PR comment if one already exists", () => {
      expect(content).toContain("updateComment");
    });

    it("should fall back to branch lookup when PR number is not in context payload", () => {
      expect(content).toContain("pulls.list");
      expect(content).toContain("refs/heads/");
    });

    it("should not contain tabs (YAML uses spaces)", () => {
      expect(content).not.toMatch(/\t/);
    });
  });

  // ─── post-test-results.yml ─────────────────────────────────────────────────

  describe("post-test-results.yml", () => {
    let content;

    beforeAll(() => {
      content = readWorkflow("post-test-results.yml");
    });

    it("should exist", () => {
      expect(workflowExists("post-test-results.yml")).toBe(true);
    });

    it("should be readable without errors", () => {
      expect(() => readWorkflow("post-test-results.yml")).not.toThrow();
    });

    it("should trigger on workflow_run completed events", () => {
      expect(content).toContain("workflow_run:");
      expect(content).toContain("types: [completed]");
    });

    it("should listen to Lint, Test, and Build workflows (not old CI)", () => {
      expect(content).toMatch(/workflows:\s*\[Lint,\s*Test,\s*Build\]/);
      expect(content).not.toContain('"CI"');
      expect(content).not.toContain("'CI'");
    });

    it("should NOT reference the removed CI workflow", () => {
      // The old workflow triggered only on "CI"; make sure that's gone
      expect(content).not.toMatch(/workflows:\s*\["CI"\]/);
    });

    it("should have the aggregate-report job (renamed from comment-on-pr)", () => {
      expect(content).toContain("aggregate-report:");
      expect(content).not.toContain("comment-on-pr:");
    });

    it("should use the github-script action", () => {
      expect(content).toContain("actions/github-script");
    });

    it("should have pull-requests write permission", () => {
      expect(content).toContain("pull-requests: write");
    });

    it("should have actions read permission", () => {
      expect(content).toContain("actions: read");
    });

    it("should aggregate status across the 3 workflows", () => {
      // Verify all three workflow names appear in the script as tracked workflows
      expect(content).toContain("'Lint'");
      expect(content).toContain("'Test'");
      expect(content).toContain("'Build'");
    });

    it("should use the ci-cd-test-results marker for PR comments", () => {
      expect(content).toContain("<!-- ci-cd-test-results -->");
    });

    it("should look up check runs for the head SHA", () => {
      expect(content).toContain("checks.listForRef");
      expect(content).toContain("headSha");
    });

    it("should fall back to listing workflow runs when check runs are missing", () => {
      expect(content).toContain("actions.listWorkflowRuns");
    });

    it("should produce an overall status of 'all passed' when all succeed", () => {
      expect(content).toContain("all passed");
    });

    it("should produce an overall status of 'some checks failed' on failure", () => {
      expect(content).toContain("some checks failed");
    });

    it("should produce an overall status of 'in progress' when not all completed", () => {
      expect(content).toContain("in progress");
    });

    it("should produce an overall status of 'mixed results' for other cases", () => {
      expect(content).toContain("mixed results");
    });

    it("should render a markdown table with status, workflow, and result columns", () => {
      expect(content).toContain("| Status | Workflow | Result |");
    });

    it("should include a timed_out ⏰ emoji mapping", () => {
      expect(content).toContain("timed_out");
      expect(content).toContain("⏰");
    });

    it("should record which triggering workflow last updated the comment", () => {
      expect(content).toContain("triggerRun.name");
    });

    it("should create a comment when none exists", () => {
      expect(content).toContain("createComment");
    });

    it("should update the existing comment when one is found", () => {
      expect(content).toContain("updateComment");
    });

    it("should not contain tabs (YAML uses spaces)", () => {
      expect(content).not.toMatch(/\t/);
    });
  });

  // ─── welcome.yml ───────────────────────────────────────────────────────────

  describe("welcome.yml", () => {
    let content;

    beforeAll(() => {
      content = readWorkflow("welcome.yml");
    });

    it("should exist", () => {
      expect(workflowExists("welcome.yml")).toBe(true);
    });

    it("should be readable without errors", () => {
      expect(() => readWorkflow("welcome.yml")).not.toThrow();
    });

    it("should still trigger on issue opened events", () => {
      expect(content).toContain("issues:");
      expect(content).toMatch(/types:\s*\[opened\]/);
    });

    it("should trigger pull_request_target on labeled events (not opened)", () => {
      expect(content).toContain("pull_request_target:");
      // The new trigger type is labeled
      const prTargetSection = content.slice(content.indexOf("pull_request_target:"));
      expect(prTargetSection).toMatch(/types:\s*\[labeled\]/);
    });

    it("should NOT trigger pull_request_target on opened events", () => {
      // The old trigger [opened] for PRs was replaced by [labeled]
      const prTargetSection = content.slice(content.indexOf("pull_request_target:"));
      const firstOnSection = prTargetSection.indexOf("issues:");
      const prTargetBlock = firstOnSection > 0 ? prTargetSection.slice(0, firstOnSection) : prTargetSection;
      expect(prTargetBlock).not.toMatch(/types:\s*\[opened\]/);
    });

    it("should gate execution on the safe-to-test label for PRs", () => {
      expect(content).toContain("safe-to-test");
      expect(content).toMatch(/contains\(github\.event\.pull_request\.labels\.\*\.name,\s*['"]safe-to-test['"]\)/);
    });

    it("should exclude dependabot from the greeting", () => {
      expect(content).toContain("dependabot[bot]");
      expect(content).toMatch(/github\.actor\s*!=\s*['"]dependabot\[bot\]['"]/);
    });

    it("should exclude github-actions bot from the greeting", () => {
      expect(content).toContain("github-actions[bot]");
      expect(content).toMatch(/github\.actor\s*!=\s*['"]github-actions\[bot\]['"]/);
    });

    it("should have pull-requests write permission", () => {
      expect(content).toContain("pull-requests: write");
    });

    it("should have issues write permission", () => {
      expect(content).toContain("issues: write");
    });

    it("should use actions/first-interaction", () => {
      expect(content).toContain("actions/first-interaction");
    });

    it("should not contain tabs (YAML uses spaces)", () => {
      expect(content).not.toMatch(/\t/);
    });
  });

  // ─── ci.yml (deleted) ──────────────────────────────────────────────────────

  describe("ci.yml (deleted)", () => {
    it("should no longer exist in the workflows directory", () => {
      expect(workflowExists("ci.yml")).toBe(false);
    });
  });

  // ─── Cross-workflow consistency ─────────────────────────────────────────────

  describe("build, lint and test workflow consistency", () => {
    let buildContent;
    let lintContent;
    let testContent;

    beforeAll(() => {
      buildContent = readWorkflow("build.yml");
      lintContent = readWorkflow("lint.yml");
      testContent = readWorkflow("test.yml");
    });

    it("all three workflows should use the same pnpm version", () => {
      const pnpmVersion = /version:\s*(\d+)/.exec(buildContent)?.[1];
      expect(pnpmVersion).toBeDefined();
      expect(lintContent).toMatch(new RegExp(`version:\\s*${pnpmVersion}`));
      expect(testContent).toMatch(new RegExp(`version:\\s*${pnpmVersion}`));
    });

    it("all three workflows should use the same Node.js version", () => {
      const nodeVersion = /node-version:\s*["']?(\d+)["']?/.exec(buildContent)?.[1];
      expect(nodeVersion).toBeDefined();
      expect(lintContent).toMatch(new RegExp(`node-version:\\s*["']?${nodeVersion}["']?`));
      expect(testContent).toMatch(new RegExp(`node-version:\\s*["']?${nodeVersion}["']?`));
    });

    it("all three workflows should install dependencies with --frozen-lockfile", () => {
      expect(buildContent).toContain("pnpm install --frozen-lockfile");
      expect(lintContent).toContain("pnpm install --frozen-lockfile");
      expect(testContent).toContain("pnpm install --frozen-lockfile");
    });

    it("all three workflows should call reporter.yml from report-status", () => {
      expect(buildContent).toContain("./.github/workflows/reporter.yml");
      expect(lintContent).toContain("./.github/workflows/reporter.yml");
      expect(testContent).toContain("./.github/workflows/reporter.yml");
    });

    it("each workflow's report-status should pass its own workflow_name", () => {
      expect(buildContent).toMatch(/workflow_name:\s*["']Build["']/);
      expect(lintContent).toMatch(/workflow_name:\s*["']Lint["']/);
      expect(testContent).toMatch(/workflow_name:\s*["']Test["']/);
    });

    it("all three workflows should restrict PRs to labeled trigger type", () => {
      for (const wf of [buildContent, lintContent, testContent]) {
        expect(wf).toMatch(/types:\s*\[labeled\]/);
      }
    });

    it("all three workflows should require safe-to-test label for PR runs", () => {
      for (const wf of [buildContent, lintContent, testContent]) {
        expect(wf).toMatch(/contains\(github\.event\.pull_request\.labels\.\*\.name,\s*['"]safe-to-test['"]\)/);
      }
    });
  });

  // ─── .gitignore ────────────────────────────────────────────────────────────

  describe(".gitignore", () => {
    const gitignorePath = path.join(process.cwd(), ".gitignore");
    let gitignoreContent;

    beforeAll(() => {
      gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    });

    it("should exist", () => {
      expect(fs.existsSync(gitignorePath)).toBe(true);
    });

    it("should explicitly un-ignore .github/workflows/test.yml", () => {
      expect(gitignoreContent).toContain("!.github/workflows/test.yml");
    });

    it("should still ignore .turbo", () => {
      expect(gitignoreContent).toContain(".turbo");
    });
  });
});
