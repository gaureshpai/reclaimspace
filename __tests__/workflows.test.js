import fs from "node:fs";
import path from "node:path";

describe("GitHub Actions Workflows", () => {
  const workflowsDir = path.join(process.cwd(), ".github", "workflows");

  describe("ci.yml", () => {
    const ciWorkflowPath = path.join(workflowsDir, "ci.yml");
    let ciWorkflow;

    beforeAll(() => {
      ciWorkflow = fs.readFileSync(ciWorkflowPath, "utf8");
    });

    it("should exist", () => {
      expect(fs.existsSync(ciWorkflowPath)).toBe(true);
    });

    it("should be named 'CI'", () => {
      expect(ciWorkflow).toMatch(/^name:\s*CI\s*$/m);
    });

    it("should not trigger on push to main (only pull_request)", () => {
      expect(ciWorkflow).not.toContain("push:");
    });

    it("should trigger on pull_request to main", () => {
      expect(ciWorkflow).toContain("pull_request:");
    });

    it("should use pnpm version 10", () => {
      expect(ciWorkflow).toMatch(/version:\s*10/);
    });

    it("should not use pnpm version 9", () => {
      expect(ciWorkflow).not.toMatch(/version:\s*9\b/);
    });

    it("should use Node.js version 20", () => {
      expect(ciWorkflow).toMatch(/node-version:\s*["']?20["']?/);
    });

    it("should install dependencies", () => {
      expect(ciWorkflow).toContain("pnpm install");
      expect(ciWorkflow).not.toContain("--frozen-lockfile");
    });

    it("should have a 'Verify package' step using pnpm pack --dry-run", () => {
      expect(ciWorkflow).toContain("Verify package");
      expect(ciWorkflow).toContain("pnpm pack --dry-run");
    });

    it("should run Biome lint via pnpm lint", () => {
      expect(ciWorkflow).toContain("Run Biome lint");
      expect(ciWorkflow).toContain("pnpm lint");
    });

    it("should run tests via pnpm test", () => {
      expect(ciWorkflow).toContain("Run tests");
      expect(ciWorkflow).toContain("pnpm test");
    });

    it("should checkout code", () => {
      expect(ciWorkflow).toContain("actions/checkout@v4");
    });

    it("should cache pnpm store", () => {
      expect(ciWorkflow).toContain('cache: "pnpm"');
    });

    it("should use environment: ci for approval gate", () => {
      expect(ciWorkflow).toContain("environment: ci");
    });

    it("should have a single job with all steps", () => {
      expect(ciWorkflow).toContain("jobs:");
      expect(ciWorkflow).toMatch(/^\s+ci:\s*$/m);
    });

    it("should not have syntax errors (no tabs)", () => {
      expect(ciWorkflow).not.toMatch(/\t/);
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

    it("should trigger on workflow_run for CI", () => {
      expect(postTest).toContain("workflow_run:");
      expect(postTest).toContain("CI");
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

    it("should find the ci check run", () => {
      expect(postTest).toContain("c.name === 'ci'");
    });

    it("should fetch check runs for the commit SHA", () => {
      expect(postTest).toContain("checks.listForRef");
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

    it("should handle timed_out conclusion", () => {
      expect(postTest).toContain("timed_out");
    });

    it("should not have syntax errors (no tabs)", () => {
      expect(postTest).not.toMatch(/\t/);
    });
  });

  describe("welcome.yml", () => {
    const welcomePath = path.join(workflowsDir, "welcome.yml");
    let welcome;

    beforeAll(() => {
      welcome = fs.readFileSync(welcomePath, "utf8");
    });

    it("should exist", () => {
      expect(fs.existsSync(welcomePath)).toBe(true);
    });

    it("should be named 'Welcome New Contributors'", () => {
      expect(welcome).toMatch(/^name:\s*Welcome New Contributors\s*$/m);
    });

    it("should trigger on issues opened", () => {
      expect(welcome).toContain("issues:");
      expect(welcome).toContain("types: [opened]");
    });

    it("should trigger on pull_request_target labeled", () => {
      expect(welcome).toContain("pull_request_target:");
      expect(welcome).toContain("types: [labeled]");
    });

    it("should have safe-to-test label condition", () => {
      expect(welcome).toContain("safe-to-test");
    });

    it("should use actions/first-interaction@v1", () => {
      expect(welcome).toContain("actions/first-interaction@v1");
    });

    it("should not have syntax errors (no tabs)", () => {
      expect(welcome).not.toMatch(/\t/);
    });
  });

  describe("update-changelog.yml", () => {
    const updatePath = path.join(workflowsDir, "update-changelog.yml");
    let update;

    beforeAll(() => {
      update = fs.readFileSync(updatePath, "utf8");
    });

    it("should exist", () => {
      expect(fs.existsSync(updatePath)).toBe(true);
    });

    it("should be named 'Update Changelog'", () => {
      expect(update).toMatch(/^name:\s*Update Changelog\s*$/m);
    });

    it("should trigger on pull_request closed to main", () => {
      expect(update).toContain("types: [closed]");
      expect(update).toContain("branches: [main]");
    });

    it("should only run on merged PRs", () => {
      expect(update).toContain("github.event.pull_request.merged == true");
    });

    it("should have contents: write permission", () => {
      expect(update).toContain("contents: write");
    });

    it("should use today's date for the heading", () => {
      expect(update).toContain('TODAY=$(date -u +"%Y-%m-%d")');
    });

    it("should check if date heading already exists", () => {
      expect(update).toContain("grep -q");
    });

    it("should use conventional commit type mapping", () => {
      expect(update).toContain("feat)");
      expect(update).toContain("fix)");
      expect(update).toContain("ci)");
    });

    it("should commit with skip ci tag", () => {
      expect(update).toContain("[skip ci]");
    });

    it("should not have syntax errors (no tabs)", () => {
      expect(update).not.toMatch(/\t/);
    });
  });

  describe("publish.yml", () => {
    const publishPath = path.join(workflowsDir, "publish.yml");
    let publish;

    beforeAll(() => {
      publish = fs.readFileSync(publishPath, "utf8");
    });

    it("should exist", () => {
      expect(fs.existsSync(publishPath)).toBe(true);
    });

    it("should be named 'Publish Package'", () => {
      expect(publish).toMatch(/^name:\s*Publish Package\s*$/m);
    });

    it("should trigger on tag push", () => {
      expect(publish).toContain("tags:");
      expect(publish).toContain("'v*'");
    });

    it("should have id-token: write for OIDC", () => {
      expect(publish).toContain("id-token: write");
    });

    it("should have contents: write permission", () => {
      expect(publish).toContain("contents: write");
    });

    it("should use npm publish with provenance", () => {
      expect(publish).toContain("npm publish --provenance --access public");
    });

    it("should update CHANGELOG with release version", () => {
      expect(publish).toContain("Update CHANGELOG with release version");
      expect(publish).toContain("Release: ${VERSION}");
    });

    it("should create a GitHub release", () => {
      expect(publish).toContain("softprops/action-gh-release@v2");
      expect(publish).toContain("generate_release_notes: true");
    });

    it("should not have syntax errors (no tabs)", () => {
      expect(publish).not.toMatch(/\t/);
    });
  });
});
