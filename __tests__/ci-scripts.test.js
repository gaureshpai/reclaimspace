/**
 * Unit tests for the JavaScript logic embedded in GitHub Actions workflow scripts.
 *
 * These tests extract and verify the key logic from:
 * - .github/workflows/post-test-results.yml (status aggregation, emoji mapping, body building)
 * - .github/workflows/reporter.yml (row building, comment update logic)
 *
 * The functions are implemented here as pure JS mirrors of the embedded scripts
 * so they can be tested without a GitHub Actions runtime.
 */

// ---------------------------------------------------------------------------
// Logic extracted from post-test-results.yml
// ---------------------------------------------------------------------------

const WORKFLOWS = ["Lint", "Test", "Build"];

/**
 * Determines whether all workflows have completed (not pending/queued/in_progress).
 */
function computeAllCompleted(statuses = {}) {
  return WORKFLOWS.every(
    (w) =>
      statuses[w] &&
      statuses[w].conclusion !== "pending" &&
      statuses[w].conclusion !== "queued" &&
      statuses[w].conclusion !== "in_progress",
  );
}

/**
 * Determines whether all workflows succeeded.
 */
function computeAllSuccess(statuses) {
  return WORKFLOWS.every((w) => statuses[w]?.conclusion === "success");
}

/**
 * Determines whether any workflow failed, was cancelled, or timed out.
 */
function computeAnyFailure(statuses) {
  return WORKFLOWS.some(
    (w) =>
      statuses[w]?.conclusion === "failure" ||
      statuses[w]?.conclusion === "cancelled" ||
      statuses[w]?.conclusion === "timed_out",
  );
}

/**
 * Maps a conclusion string to the appropriate emoji.
 * Mirrors the logic in post-test-results.yml.
 */
function conclusionToEmoji(conclusion) {
  if (conclusion === "success") return "✅";
  if (conclusion === "failure") return "❌";
  if (conclusion === "cancelled") return "⏹️";
  if (conclusion === "skipped") return "⏭️";
  if (conclusion === "timed_out") return "⏰";
  return "🔄";
}

/**
 * Determines overall status label and emoji given statuses object.
 * Mirrors the if/else chain in post-test-results.yml.
 */
function computeOverallStatus(statuses) {
  const allCompleted = computeAllCompleted(statuses);
  const allSuccess = computeAllSuccess(statuses);
  const anyFailure = computeAnyFailure(statuses);

  if (!allCompleted) {
    return { emoji: "🔄", status: "in progress" };
  }
  if (allSuccess) {
    return { emoji: "✅", status: "all passed" };
  }
  if (anyFailure) {
    return { emoji: "❌", status: "some checks failed" };
  }
  return { emoji: "⚠️", status: "mixed results" };
}

/**
 * Builds the markdown table from statuses.
 * Mirrors the table-building loop in post-test-results.yml.
 */
function buildStatusTable(statuses) {
  let table = `| Status | Workflow | Result |\n|--------|----------|--------|\n`;
  for (const wf of WORKFLOWS) {
    const s = statuses[wf] || { conclusion: "pending", html_url: null };
    const emoji = conclusionToEmoji(s.conclusion);
    const link = s.html_url ? `[details](${s.html_url})` : "-";
    table += `| ${emoji} | **${wf}** | \`${s.conclusion}\` ${link} |\n`;
  }
  return table;
}

/**
 * Builds the full comment body from statuses and the triggering workflow name.
 * Mirrors the body-building logic in post-test-results.yml.
 */
function buildCommentBody(statuses, triggerRunName) {
  const { emoji: overallEmoji, status: overallStatus } = computeOverallStatus(statuses);
  const table = buildStatusTable(statuses);
  return (
    `### ${overallEmoji} Combined CI Status <!-- ci-cd-test-results -->\n\n` +
    `**Overall**: ${overallStatus}\n\n` +
    `${table}\n` +
    `---\n` +
    `_Last updated by ${triggerRunName} workflow_\n`
  );
}

// ---------------------------------------------------------------------------
// Logic extracted from reporter.yml
// ---------------------------------------------------------------------------

const REPORTER_MARKER = "<!-- ci-status-reporter -->";

/**
 * Maps a conclusion to emoji, matching reporter.yml's emoji mapping.
 * Note: reporter uses '❔' as the fallback (not '🔄').
 */
function reporterConclusionToEmoji(conclusion) {
  if (conclusion === "success") return "✅";
  if (conclusion === "failure") return "❌";
  if (conclusion === "cancelled") return "⏹️";
  if (conclusion === "skipped") return "⏭️";
  return "❔";
}

/**
 * Builds a single table row for the reporter comment.
 * Mirrors the newRow construction in reporter.yml.
 */
function buildReporterRow(workflowName, conclusion, runUrl) {
  const emoji = reporterConclusionToEmoji(conclusion);
  return `| ${emoji} | **${workflowName}** | \`${conclusion}\` | [View run](${runUrl}) |`;
}

/**
 * Builds the reporter comment header.
 */
function buildReporterHeader() {
  return (
    `### 🔄 CI Status Report ${REPORTER_MARKER}\n\n` +
    `| Status | Workflow | Result | Details |\n` +
    `|--------|----------|--------|---------|\n`
  );
}

/**
 * Computes the new comment body for reporter.yml.
 * When an existing comment is found, it merges rows — replacing the row for
 * workflowName and keeping others. Mirrors the body computation in reporter.yml.
 */
function computeReporterBody(existingCommentBody, workflowName, newRow) {
  const header = buildReporterHeader();

  if (existingCommentBody) {
    const lines = existingCommentBody.split("\n");
    const headerEnd = lines.findIndex((l) => l.startsWith("|--------|"));
    if (headerEnd !== -1) {
      const existingRows = lines.slice(headerEnd + 1).filter((l) => l.startsWith("|"));
      const rowKey = `**${workflowName}**`;
      const keptRows = existingRows.filter((l) => !l.includes(rowKey));
      const allRows = [...keptRows, newRow].sort();
      return header + allRows.join("\n");
    }
  }

  return header + newRow;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("post-test-results.yml script logic", () => {
  describe("computeAllCompleted", () => {
    it("should return true when all workflows have 'success' conclusion", () => {
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "success" },
        Build: { conclusion: "success" },
      };
      expect(computeAllCompleted(statuses)).toBe(true);
    });

    it("should return true when all workflows have terminal conclusions", () => {
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "failure" },
        Build: { conclusion: "cancelled" },
      };
      expect(computeAllCompleted(statuses)).toBe(true);
    });

    it("should return false when any workflow is still pending", () => {
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "pending" },
        Build: { conclusion: "success" },
      };
      expect(computeAllCompleted(statuses)).toBe(false);
    });

    it("should return false when any workflow is queued", () => {
      const statuses = {
        Lint: { conclusion: "queued" },
        Test: { conclusion: "success" },
        Build: { conclusion: "success" },
      };
      expect(computeAllCompleted(statuses)).toBe(false);
    });

    it("should return false when any workflow is in_progress", () => {
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "in_progress" },
        Build: { conclusion: "success" },
      };
      expect(computeAllCompleted(statuses)).toBe(false);
    });

    it("should return false when a workflow status is explicitly set to 'pending' (fallback value)", () => {
      // The real script sets statuses[wf] = { conclusion: 'pending' } for missing workflows
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "pending" }, // filled in by the fallback code
        Build: { conclusion: "success" },
      };
      expect(computeAllCompleted(statuses)).toBe(false);
    });

    it("should return true when a workflow status conclusion is 'unknown' (error fallback)", () => {
      // When the API call throws, the script sets conclusion to 'unknown'
      // 'unknown' is not pending/queued/in_progress, so it is considered completed
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "unknown" },
        Build: { conclusion: "success" },
      };
      expect(computeAllCompleted(statuses)).toBe(true);
    });
  });

  describe("computeAllSuccess", () => {
    it("should return true when all three workflows succeed", () => {
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "success" },
        Build: { conclusion: "success" },
      };
      expect(computeAllSuccess(statuses)).toBe(true);
    });

    it("should return false when one workflow failed", () => {
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "failure" },
        Build: { conclusion: "success" },
      };
      expect(computeAllSuccess(statuses)).toBe(false);
    });

    it("should return false when one workflow was skipped", () => {
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "skipped" },
        Build: { conclusion: "success" },
      };
      expect(computeAllSuccess(statuses)).toBe(false);
    });

    it("should return false when a workflow is still pending", () => {
      const statuses = {
        Lint: { conclusion: "pending" },
        Test: { conclusion: "success" },
        Build: { conclusion: "success" },
      };
      expect(computeAllSuccess(statuses)).toBe(false);
    });
  });

  describe("computeAnyFailure", () => {
    it("should return true when any workflow has conclusion 'failure'", () => {
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "failure" },
        Build: { conclusion: "success" },
      };
      expect(computeAnyFailure(statuses)).toBe(true);
    });

    it("should return true when any workflow was cancelled", () => {
      const statuses = {
        Lint: { conclusion: "cancelled" },
        Test: { conclusion: "success" },
        Build: { conclusion: "success" },
      };
      expect(computeAnyFailure(statuses)).toBe(true);
    });

    it("should return true when any workflow timed out", () => {
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "timed_out" },
        Build: { conclusion: "success" },
      };
      expect(computeAnyFailure(statuses)).toBe(true);
    });

    it("should return false when all workflows succeeded", () => {
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "success" },
        Build: { conclusion: "success" },
      };
      expect(computeAnyFailure(statuses)).toBe(false);
    });

    it("should return false when workflows are skipped (not a failure)", () => {
      const statuses = {
        Lint: { conclusion: "skipped" },
        Test: { conclusion: "success" },
        Build: { conclusion: "success" },
      };
      expect(computeAnyFailure(statuses)).toBe(false);
    });
  });

  describe("conclusionToEmoji (post-test-results)", () => {
    it("maps 'success' to ✅", () => {
      expect(conclusionToEmoji("success")).toBe("✅");
    });

    it("maps 'failure' to ❌", () => {
      expect(conclusionToEmoji("failure")).toBe("❌");
    });

    it("maps 'cancelled' to ⏹️", () => {
      expect(conclusionToEmoji("cancelled")).toBe("⏹️");
    });

    it("maps 'skipped' to ⏭️", () => {
      expect(conclusionToEmoji("skipped")).toBe("⏭️");
    });

    it("maps 'timed_out' to ⏰", () => {
      expect(conclusionToEmoji("timed_out")).toBe("⏰");
    });

    it("maps any unknown/pending value to 🔄", () => {
      expect(conclusionToEmoji("pending")).toBe("🔄");
      expect(conclusionToEmoji("in_progress")).toBe("🔄");
      expect(conclusionToEmoji("unknown")).toBe("🔄");
      expect(conclusionToEmoji("")).toBe("🔄");
    });
  });

  describe("computeOverallStatus", () => {
    it("returns 'in progress' when not all workflows have completed", () => {
      const statuses = {
        Lint: { conclusion: "pending" },
        Test: { conclusion: "success" },
        Build: { conclusion: "success" },
      };
      const result = computeOverallStatus(statuses);
      expect(result.status).toBe("in progress");
      expect(result.emoji).toBe("🔄");
    });

    it("returns 'all passed' when all workflows succeeded", () => {
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "success" },
        Build: { conclusion: "success" },
      };
      const result = computeOverallStatus(statuses);
      expect(result.status).toBe("all passed");
      expect(result.emoji).toBe("✅");
    });

    it("returns 'some checks failed' when any workflow failed", () => {
      const statuses = {
        Lint: { conclusion: "success" },
        Test: { conclusion: "failure" },
        Build: { conclusion: "success" },
      };
      const result = computeOverallStatus(statuses);
      expect(result.status).toBe("some checks failed");
      expect(result.emoji).toBe("❌");
    });

    it("returns 'some checks failed' when any workflow was cancelled", () => {
      const statuses = {
        Lint: { conclusion: "cancelled" },
        Test: { conclusion: "success" },
        Build: { conclusion: "success" },
      };
      const result = computeOverallStatus(statuses);
      expect(result.status).toBe("some checks failed");
      expect(result.emoji).toBe("❌");
    });

    it("returns 'some checks failed' when any workflow timed out", () => {
      const statuses = {
        Lint: { conclusion: "timed_out" },
        Test: { conclusion: "success" },
        Build: { conclusion: "success" },
      };
      const result = computeOverallStatus(statuses);
      expect(result.status).toBe("some checks failed");
      expect(result.emoji).toBe("❌");
    });

    it("returns 'mixed results' when all completed but not all success and no failures", () => {
      // skipped counts as not success but also not anyFailure
      const statuses = {
        Lint: { conclusion: "skipped" },
        Test: { conclusion: "success" },
        Build: { conclusion: "success" },
      };
      const result = computeOverallStatus(statuses);
      expect(result.status).toBe("mixed results");
      expect(result.emoji).toBe("⚠️");
    });
  });

  describe("buildStatusTable", () => {
    it("should include header row", () => {
      const statuses = {
        Lint: { conclusion: "success", html_url: null },
        Test: { conclusion: "success", html_url: null },
        Build: { conclusion: "success", html_url: null },
      };
      const table = buildStatusTable(statuses);
      expect(table).toContain("| Status | Workflow | Result |");
      expect(table).toContain("|--------|----------|--------|");
    });

    it("should include a row for each of the 3 workflows", () => {
      const statuses = {
        Lint: { conclusion: "success", html_url: null },
        Test: { conclusion: "failure", html_url: null },
        Build: { conclusion: "pending", html_url: null },
      };
      const table = buildStatusTable(statuses);
      expect(table).toContain("**Lint**");
      expect(table).toContain("**Test**");
      expect(table).toContain("**Build**");
    });

    it("should render correct emoji per workflow conclusion", () => {
      const statuses = {
        Lint: { conclusion: "success", html_url: null },
        Test: { conclusion: "failure", html_url: null },
        Build: { conclusion: "pending", html_url: null },
      };
      const table = buildStatusTable(statuses);
      expect(table).toContain("✅");
      expect(table).toContain("❌");
      expect(table).toContain("🔄");
    });

    it("should show '-' as link when html_url is null", () => {
      const statuses = {
        Lint: { conclusion: "success", html_url: null },
        Test: { conclusion: "success", html_url: null },
        Build: { conclusion: "success", html_url: null },
      };
      const table = buildStatusTable(statuses);
      expect(table).toContain("- |");
    });

    it("should render a [details] link when html_url is provided", () => {
      const statuses = {
        Lint: { conclusion: "success", html_url: "https://example.com/run/1" },
        Test: { conclusion: "success", html_url: null },
        Build: { conclusion: "success", html_url: null },
      };
      const table = buildStatusTable(statuses);
      expect(table).toContain("[details](https://example.com/run/1)");
    });

    it("should use 'pending' conclusion when a workflow status is missing", () => {
      const statuses = {
        Lint: { conclusion: "success", html_url: null },
        Test: { conclusion: "success", html_url: null },
        // Build is missing
      };
      const table = buildStatusTable(statuses);
      expect(table).toContain("`pending`");
    });
  });

  describe("buildCommentBody", () => {
    it("should contain the ci-cd-test-results marker", () => {
      const statuses = {
        Lint: { conclusion: "success", html_url: null },
        Test: { conclusion: "success", html_url: null },
        Build: { conclusion: "success", html_url: null },
      };
      const body = buildCommentBody(statuses, "Build");
      expect(body).toContain("<!-- ci-cd-test-results -->");
    });

    it("should reference the triggering workflow name", () => {
      const statuses = {
        Lint: { conclusion: "success", html_url: null },
        Test: { conclusion: "success", html_url: null },
        Build: { conclusion: "success", html_url: null },
      };
      const body = buildCommentBody(statuses, "Lint");
      expect(body).toContain("Lint workflow");
    });

    it("should include overall status text", () => {
      const statuses = {
        Lint: { conclusion: "success", html_url: null },
        Test: { conclusion: "success", html_url: null },
        Build: { conclusion: "success", html_url: null },
      };
      const body = buildCommentBody(statuses, "Build");
      expect(body).toContain("**Overall**: all passed");
    });

    it("should include a separator and footer", () => {
      const statuses = {
        Lint: { conclusion: "success", html_url: null },
        Test: { conclusion: "success", html_url: null },
        Build: { conclusion: "success", html_url: null },
      };
      const body = buildCommentBody(statuses, "Build");
      expect(body).toContain("---\n");
    });

    it("should show failure overall status when one workflow failed", () => {
      const statuses = {
        Lint: { conclusion: "failure", html_url: null },
        Test: { conclusion: "success", html_url: null },
        Build: { conclusion: "success", html_url: null },
      };
      const body = buildCommentBody(statuses, "Lint");
      expect(body).toContain("some checks failed");
    });
  });
});

describe("reporter.yml script logic", () => {
  describe("reporterConclusionToEmoji", () => {
    it("maps 'success' to ✅", () => {
      expect(reporterConclusionToEmoji("success")).toBe("✅");
    });

    it("maps 'failure' to ❌", () => {
      expect(reporterConclusionToEmoji("failure")).toBe("❌");
    });

    it("maps 'cancelled' to ⏹️", () => {
      expect(reporterConclusionToEmoji("cancelled")).toBe("⏹️");
    });

    it("maps 'skipped' to ⏭️", () => {
      expect(reporterConclusionToEmoji("skipped")).toBe("⏭️");
    });

    it("maps unknown/pending to ❔ (not 🔄 like post-test-results)", () => {
      expect(reporterConclusionToEmoji("pending")).toBe("❔");
      expect(reporterConclusionToEmoji("unknown")).toBe("❔");
      expect(reporterConclusionToEmoji("")).toBe("❔");
    });
  });

  describe("buildReporterRow", () => {
    it("should build a markdown table row with emoji, name, conclusion, and link", () => {
      const row = buildReporterRow("Build", "success", "https://example.com/run/42");
      expect(row).toContain("✅");
      expect(row).toContain("**Build**");
      expect(row).toContain("`success`");
      expect(row).toContain("[View run](https://example.com/run/42)");
    });

    it("should use failure emoji for failure conclusion", () => {
      const row = buildReporterRow("Lint", "failure", "https://example.com/run/1");
      expect(row).toContain("❌");
      expect(row).toContain("**Lint**");
    });

    it("should use cancelled emoji for cancelled conclusion", () => {
      const row = buildReporterRow("Test", "cancelled", "https://example.com/run/2");
      expect(row).toContain("⏹️");
    });

    it("row should start and end with pipe characters", () => {
      const row = buildReporterRow("Build", "success", "https://example.com");
      expect(row.startsWith("|")).toBe(true);
      expect(row.endsWith("|")).toBe(true);
    });
  });

  describe("buildReporterHeader", () => {
    it("should contain the ci-status-reporter marker", () => {
      const header = buildReporterHeader();
      expect(header).toContain("<!-- ci-status-reporter -->");
    });

    it("should contain the table header row", () => {
      const header = buildReporterHeader();
      expect(header).toContain("| Status | Workflow | Result | Details |");
    });

    it("should contain the table separator row", () => {
      const header = buildReporterHeader();
      expect(header).toContain("|--------|----------|--------|---------|\n");
    });
  });

  describe("computeReporterBody - new comment", () => {
    it("should create a comment with the header and a single row when no existing comment", () => {
      const row = buildReporterRow("Build", "success", "https://example.com/run/1");
      const body = computeReporterBody(null, "Build", row);
      expect(body).toContain("<!-- ci-status-reporter -->");
      expect(body).toContain("**Build**");
      expect(body).toContain("`success`");
    });

    it("should not include rows from other workflows when creating fresh", () => {
      const row = buildReporterRow("Build", "success", "https://example.com/run/1");
      const body = computeReporterBody(null, "Build", row);
      expect(body).not.toContain("**Lint**");
      expect(body).not.toContain("**Test**");
    });
  });

  describe("computeReporterBody - updating existing comment", () => {
    const existingLintRow = buildReporterRow("Lint", "success", "https://example.com/run/10");
    const existingTestRow = buildReporterRow("Test", "success", "https://example.com/run/11");
    const existingComment =
      buildReporterHeader() + [existingLintRow, existingTestRow].sort().join("\n");

    it("should add a new workflow row when updating an existing comment", () => {
      const newRow = buildReporterRow("Build", "success", "https://example.com/run/12");
      const body = computeReporterBody(existingComment, "Build", newRow);
      expect(body).toContain("**Build**");
    });

    it("should preserve rows for other workflows when updating", () => {
      const newRow = buildReporterRow("Build", "failure", "https://example.com/run/12");
      const body = computeReporterBody(existingComment, "Build", newRow);
      expect(body).toContain("**Lint**");
      expect(body).toContain("**Test**");
    });

    it("should replace the existing row for the same workflow", () => {
      const updatedRow = buildReporterRow("Lint", "failure", "https://example.com/run/20");
      const body = computeReporterBody(existingComment, "Lint", updatedRow);

      // Old success row for Lint should be gone
      expect(body).not.toContain(existingLintRow);
      // New failure row should be present
      expect(body).toContain("`failure`");
    });

    it("should result in exactly one row per workflow (no duplicates)", () => {
      const newRow = buildReporterRow("Lint", "failure", "https://example.com/run/20");
      const body = computeReporterBody(existingComment, "Lint", newRow);

      // Count occurrences of **Lint** in the body
      const lintOccurrences = (body.match(/\*\*Lint\*\*/g) || []).length;
      expect(lintOccurrences).toBe(1);
    });

    it("should keep the ci-status-reporter marker in the updated body", () => {
      const newRow = buildReporterRow("Build", "success", "https://example.com/run/12");
      const body = computeReporterBody(existingComment, "Build", newRow);
      expect(body).toContain("<!-- ci-status-reporter -->");
    });

    it("should sort all rows alphabetically in the updated body", () => {
      const newRow = buildReporterRow("Build", "success", "https://example.com/run/12");
      const body = computeReporterBody(existingComment, "Build", newRow);

      const lines = body.split("\n");
      const headerEnd = lines.findIndex((l) => l.startsWith("|--------|"));
      const rows = lines.slice(headerEnd + 1).filter((l) => l.startsWith("|"));

      const sortedRows = [...rows].sort();
      expect(rows).toEqual(sortedRows);
    });
  });

  describe("edge cases", () => {
    it("buildReporterRow handles unknown conclusion gracefully", () => {
      const row = buildReporterRow("Build", "unknown_state", "https://example.com");
      expect(row).toContain("❔");
      expect(row).toContain("`unknown_state`");
    });

    it("buildStatusTable handles workflow with 'timed_out' conclusion", () => {
      const statuses = {
        Lint: {
          conclusion: "timed_out",
          html_url: "https://example.com/run/99",
        },
        Test: { conclusion: "success", html_url: null },
        Build: { conclusion: "success", html_url: null },
      };
      const table = buildStatusTable(statuses);
      expect(table).toContain("⏰");
      expect(table).toContain("`timed_out`");
    });

    it("computeOverallStatus: all pending = in progress", () => {
      const statuses = {
        Lint: { conclusion: "pending" },
        Test: { conclusion: "pending" },
        Build: { conclusion: "pending" },
      };
      const result = computeOverallStatus(statuses);
      expect(result.status).toBe("in progress");
    });

    it("computeOverallStatus: mix of success and skipped = mixed results", () => {
      const statuses = {
        Lint: { conclusion: "skipped" },
        Test: { conclusion: "skipped" },
        Build: { conclusion: "success" },
      };
      const result = computeOverallStatus(statuses);
      expect(result.status).toBe("mixed results");
    });
  });
});
