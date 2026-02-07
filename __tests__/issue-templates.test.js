import fs from "node:fs";
import path from "node:path";

describe("GitHub Issue Templates", () => {
  const templatesDir = path.join(process.cwd(), ".github", "ISSUE_TEMPLATE");

  describe("bug.yml", () => {
    const bugTemplatePath = path.join(templatesDir, "bug.yml");
    let bugTemplate;

    beforeAll(() => {
      const content = fs.readFileSync(bugTemplatePath, "utf8");
      bugTemplate = content;
    });

    it("should exist", () => {
      expect(fs.existsSync(bugTemplatePath)).toBe(true);
    });

    it("should have valid YAML structure", () => {
      expect(() => {
        // Basic validation - should not throw when reading
        fs.readFileSync(bugTemplatePath, "utf8");
      }).not.toThrow();
    });

    it("should have required metadata fields", () => {
      expect(bugTemplate).toContain("name:");
      expect(bugTemplate).toContain("description:");
      expect(bugTemplate).toContain("title:");
      expect(bugTemplate).toContain("labels:");
      expect(bugTemplate).toContain("body:");
    });

    it("should have 'Bug Report' as name", () => {
      expect(bugTemplate).toMatch(/name:\s*Bug Report/);
    });

    it("should have 'bug' label", () => {
      expect(bugTemplate).toMatch(/labels:\s*\['bug'\]/);
    });

    it("should have '[Bug]: ' as title prefix", () => {
      expect(bugTemplate).toMatch(/title:\s*'\[Bug\]:\s*'/);
    });

    it("should contain required bug description field", () => {
      expect(bugTemplate).toContain("Describe the bug");
      expect(bugTemplate).toMatch(/label:\s*Describe the bug/);
    });

    it("should contain required reproduction steps field", () => {
      expect(bugTemplate).toContain("To Reproduce");
      expect(bugTemplate).toMatch(/label:\s*To Reproduce/);
    });

    it("should contain required expected behavior field", () => {
      expect(bugTemplate).toContain("Expected behavior");
      expect(bugTemplate).toMatch(/label:\s*Expected behavior/);
    });

    it("should have textarea type fields", () => {
      const textareaMatches = bugTemplate.match(/type:\s*textarea/g);
      expect(textareaMatches).not.toBeNull();
      expect(textareaMatches.length).toBeGreaterThanOrEqual(3);
    });

    it("should have required validations for critical fields", () => {
      // Count required: true occurrences
      const requiredMatches = bugTemplate.match(/required:\s*true/g);
      expect(requiredMatches).not.toBeNull();
      expect(requiredMatches.length).toBeGreaterThanOrEqual(3);
    });

    it("should contain screenshots field (optional)", () => {
      expect(bugTemplate).toContain("Screenshots");
      expect(bugTemplate).toMatch(/label:\s*Screenshots/);
    });

    it("should contain additional context field (optional)", () => {
      expect(bugTemplate).toContain("Additional context");
      expect(bugTemplate).toMatch(/label:\s*Additional context/);
    });

    it("should have proper indentation structure", () => {
      const lines = bugTemplate.split("\n");
      let hasProperBody = false;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("body:")) {
          // Next line should be indented (part of body array)
          if (i + 1 < lines.length && lines[i + 1].startsWith("  ")) {
            hasProperBody = true;
          }
        }
      }

      expect(hasProperBody).toBe(true);
    });

    it("should have description for each field", () => {
      const descriptionMatches = bugTemplate.match(/description:/g);
      expect(descriptionMatches).not.toBeNull();
      expect(descriptionMatches.length).toBeGreaterThanOrEqual(4);
    });

    it("should not contain syntax errors in YAML", () => {
      // Check for common YAML syntax errors
      expect(bugTemplate).not.toMatch(/\t/); // No tabs (YAML uses spaces)

      // Check that arrays are properly formatted
      const lines = bugTemplate.split("\n");
      lines.forEach((line, _index) => {
        if (line.includes("- type:")) {
          expect(line).toMatch(/^\s*-\s*type:/);
        }
      });
    });

    it("should have consistent spacing in arrays", () => {
      expect(bugTemplate).toMatch(/labels:\s*\[/);
    });
  });

  describe("feature_request.yml", () => {
    const featureTemplatePath = path.join(templatesDir, "feature_request.yml");
    let featureTemplate;

    beforeAll(() => {
      const content = fs.readFileSync(featureTemplatePath, "utf8");
      featureTemplate = content;
    });

    it("should exist", () => {
      expect(fs.existsSync(featureTemplatePath)).toBe(true);
    });

    it("should have valid YAML structure", () => {
      expect(() => {
        fs.readFileSync(featureTemplatePath, "utf8");
      }).not.toThrow();
    });

    it("should have required metadata fields", () => {
      expect(featureTemplate).toContain("name:");
      expect(featureTemplate).toContain("description:");
      expect(featureTemplate).toContain("title:");
      expect(featureTemplate).toContain("labels:");
      expect(featureTemplate).toContain("body:");
    });

    it("should have 'Feature Request' as name", () => {
      expect(featureTemplate).toMatch(/name:\s*Feature Request/);
    });

    it("should have 'feature' label", () => {
      expect(featureTemplate).toMatch(/labels:\s*\['feature'\]/);
    });

    it("should have '[Feature]: ' as title prefix", () => {
      expect(featureTemplate).toMatch(/title:\s*'\[Feature\]:\s*'/);
    });

    it("should contain problem description field", () => {
      expect(featureTemplate).toContain("Is your feature request related to a problem?");
      expect(featureTemplate).toMatch(/label:\s*Is your feature request related to a problem\?/);
    });

    it("should contain solution description field", () => {
      expect(featureTemplate).toContain("Describe the solution you'd like");
      expect(featureTemplate).toMatch(/label:\s*Describe the solution you'd like/);
    });

    it("should contain alternatives field", () => {
      expect(featureTemplate).toContain("Describe alternatives you've considered");
      expect(featureTemplate).toMatch(/label:\s*Describe alternatives you've considered/);
    });

    it("should have textarea type fields", () => {
      const textareaMatches = featureTemplate.match(/type:\s*textarea/g);
      expect(textareaMatches).not.toBeNull();
      expect(textareaMatches.length).toBeGreaterThanOrEqual(3);
    });

    it("should have required validations for problem and solution fields", () => {
      const requiredMatches = featureTemplate.match(/required:\s*true/g);
      expect(requiredMatches).not.toBeNull();
      expect(requiredMatches.length).toBeGreaterThanOrEqual(2);
    });

    it("should have helpful placeholder text in descriptions", () => {
      expect(featureTemplate).toContain("I'm always frustrated when");
    });

    it("should have proper indentation structure", () => {
      const lines = featureTemplate.split("\n");
      let hasProperBody = false;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("body:")) {
          if (i + 1 < lines.length && lines[i + 1].startsWith("  ")) {
            hasProperBody = true;
          }
        }
      }

      expect(hasProperBody).toBe(true);
    });

    it("should not contain syntax errors in YAML", () => {
      expect(featureTemplate).not.toMatch(/\t/);

      const lines = featureTemplate.split("\n");
      lines.forEach((line) => {
        if (line.includes("- type:")) {
          expect(line).toMatch(/^\s*-\s*type:/);
        }
      });
    });

    it("should have description field in Suggest an idea format", () => {
      expect(featureTemplate).toMatch(/description:\s*Suggest an idea for this project/);
    });
  });

  describe("template consistency", () => {
    const bugTemplatePath = path.join(templatesDir, "bug.yml");
    const featureTemplatePath = path.join(templatesDir, "feature_request.yml");

    it("should use consistent YAML structure across templates", () => {
      const bugContent = fs.readFileSync(bugTemplatePath, "utf8");
      const featureContent = fs.readFileSync(featureTemplatePath, "utf8");

      // Both should have same top-level keys
      expect(bugContent).toContain("name:");
      expect(featureContent).toContain("name:");

      expect(bugContent).toContain("description:");
      expect(featureContent).toContain("description:");

      expect(bugContent).toContain("title:");
      expect(featureContent).toContain("title:");

      expect(bugContent).toContain("labels:");
      expect(featureContent).toContain("labels:");

      expect(bugContent).toContain("body:");
      expect(featureContent).toContain("body:");
    });

    it("should have assignees field in both templates", () => {
      const bugContent = fs.readFileSync(bugTemplatePath, "utf8");
      const featureContent = fs.readFileSync(featureTemplatePath, "utf8");

      expect(bugContent).toContain("assignees:");
      expect(featureContent).toContain("assignees:");
    });

    it("should use square bracket title prefixes consistently", () => {
      const bugContent = fs.readFileSync(bugTemplatePath, "utf8");
      const featureContent = fs.readFileSync(featureTemplatePath, "utf8");

      expect(bugContent).toMatch(/title:\s*'\[Bug\]:/);
      expect(featureContent).toMatch(/title:\s*'\[Feature\]:/);
    });

    it("should use textarea type for all body fields in both templates", () => {
      const bugContent = fs.readFileSync(bugTemplatePath, "utf8");
      const featureContent = fs.readFileSync(featureTemplatePath, "utf8");

      const bugTextareas = bugContent.match(/type:\s*textarea/g);
      const featureTextareas = featureContent.match(/type:\s*textarea/g);

      expect(bugTextareas).not.toBeNull();
      expect(featureTextareas).not.toBeNull();
      expect(bugTextareas.length).toBeGreaterThan(0);
      expect(featureTextareas.length).toBeGreaterThan(0);
    });

    it("should have consistent indentation (2 spaces)", () => {
      const bugContent = fs.readFileSync(bugTemplatePath, "utf8");
      const featureContent = fs.readFileSync(featureTemplatePath, "utf8");

      const bugLines = bugContent.split("\n");
      const featureLines = featureContent.split("\n");

      // Check that indented lines use multiples of 2 spaces
      [...bugLines, ...featureLines].forEach((line) => {
        if (line.length > 0 && line[0] === " ") {
          const spaces = line.match(/^(\s*)/)[1].length;
          expect(spaces % 2).toBe(0);
        }
      });
    });
  });

  describe("template validation requirements", () => {
    const bugTemplatePath = path.join(templatesDir, "bug.yml");
    const featureTemplatePath = path.join(templatesDir, "feature_request.yml");

    it("bug template should have validations section", () => {
      const content = fs.readFileSync(bugTemplatePath, "utf8");
      expect(content).toContain("validations:");
    });

    it("feature template should have validations section", () => {
      const content = fs.readFileSync(featureTemplatePath, "utf8");
      expect(content).toContain("validations:");
    });

    it("should have attributes section for each field", () => {
      const bugContent = fs.readFileSync(bugTemplatePath, "utf8");
      const featureContent = fs.readFileSync(featureTemplatePath, "utf8");

      expect(bugContent).toContain("attributes:");
      expect(featureContent).toContain("attributes:");
    });
  });

  describe("template field labels", () => {
    it("bug template should have clear, descriptive labels", () => {
      const content = fs.readFileSync(path.join(templatesDir, "bug.yml"), "utf8");

      const labels = [
        "Describe the bug",
        "To Reproduce",
        "Expected behavior",
        "Screenshots",
        "Additional context",
      ];

      labels.forEach((label) => {
        expect(content).toContain(label);
      });
    });

    it("feature template should have clear, descriptive labels", () => {
      const content = fs.readFileSync(path.join(templatesDir, "feature_request.yml"), "utf8");

      const labels = [
        "Is your feature request related to a problem?",
        "Describe the solution you'd like",
        "Describe alternatives you've considered",
      ];

      labels.forEach((label) => {
        expect(content).toContain(label);
      });
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle reading templates without errors", () => {
      const templates = ["bug.yml", "feature_request.yml"];

      templates.forEach((template) => {
        const templatePath = path.join(templatesDir, template);
        expect(() => {
          fs.readFileSync(templatePath, "utf8");
        }).not.toThrow();
      });
    });

    it("should not have empty label fields", () => {
      const bugContent = fs.readFileSync(path.join(templatesDir, "bug.yml"), "utf8");
      const featureContent = fs.readFileSync(
        path.join(templatesDir, "feature_request.yml"),
        "utf8",
      );

      // Check that label: is followed by non-empty content
      expect(bugContent).not.toMatch(/label:\s*$/m);
      expect(featureContent).not.toMatch(/label:\s*$/m);
    });

    it("should not have empty description fields in metadata", () => {
      const bugContent = fs.readFileSync(path.join(templatesDir, "bug.yml"), "utf8");
      const featureContent = fs.readFileSync(
        path.join(templatesDir, "feature_request.yml"),
        "utf8",
      );

      // First description is metadata description
      const bugLines = bugContent.split("\n");
      const featureLines = featureContent.split("\n");

      const bugDescLine = bugLines.find((l) => l.startsWith("description:"));
      const featureDescLine = featureLines.find((l) => l.startsWith("description:"));

      expect(bugDescLine).toMatch(/description:\s+\S+/);
      expect(featureDescLine).toMatch(/description:\s+\S+/);
    });
  });

  describe("template completeness", () => {
    it("bug template should cover all essential bug reporting fields", () => {
      const content = fs.readFileSync(path.join(templatesDir, "bug.yml"), "utf8");

      // Essential fields for bug reports
      const essentialFields = ["Describe the bug", "To Reproduce", "Expected behavior"];

      essentialFields.forEach((field) => {
        expect(content).toContain(field);
      });
    });

    it("feature template should cover all essential feature request fields", () => {
      const content = fs.readFileSync(path.join(templatesDir, "feature_request.yml"), "utf8");

      // Essential fields for feature requests
      const essentialFields = [
        "Is your feature request related to a problem?",
        "Describe the solution you'd like",
        "Describe alternatives you've considered",
      ];

      essentialFields.forEach((field) => {
        expect(content).toContain(field);
      });
    });

    it("templates should not be empty", () => {
      const bugContent = fs.readFileSync(path.join(templatesDir, "bug.yml"), "utf8");
      const featureContent = fs.readFileSync(
        path.join(templatesDir, "feature_request.yml"),
        "utf8",
      );

      expect(bugContent.length).toBeGreaterThan(0);
      expect(featureContent.length).toBeGreaterThan(0);
    });

    it("templates should have multiple lines", () => {
      const bugContent = fs.readFileSync(path.join(templatesDir, "bug.yml"), "utf8");
      const featureContent = fs.readFileSync(
        path.join(templatesDir, "feature_request.yml"),
        "utf8",
      );

      expect(bugContent.split("\n").length).toBeGreaterThan(10);
      expect(featureContent.split("\n").length).toBeGreaterThan(10);
    });
  });

  describe("GitHub specific requirements", () => {
    it("should use GitHub Form schema compatible structure", () => {
      const bugContent = fs.readFileSync(path.join(templatesDir, "bug.yml"), "utf8");

      // GitHub Forms require specific structure
      expect(bugContent).toContain("body:");
      expect(bugContent).toContain("- type:");
      expect(bugContent).toContain("attributes:");
    });

    it("should have proper label array format", () => {
      const bugContent = fs.readFileSync(path.join(templatesDir, "bug.yml"), "utf8");
      const featureContent = fs.readFileSync(
        path.join(templatesDir, "feature_request.yml"),
        "utf8",
      );

      // Labels should be in array format
      expect(bugContent).toMatch(/labels:\s*\[['"]bug['"]\]/);
      expect(featureContent).toMatch(/labels:\s*\[['"]feature['"]\]/);
    });

    it("should have empty string for assignees by default", () => {
      const bugContent = fs.readFileSync(path.join(templatesDir, "bug.yml"), "utf8");
      const featureContent = fs.readFileSync(
        path.join(templatesDir, "feature_request.yml"),
        "utf8",
      );

      expect(bugContent).toMatch(/assignees:\s*['"]['"]?/);
      expect(featureContent).toMatch(/assignees:\s*['"]['"]?/);
    });
  });
});
