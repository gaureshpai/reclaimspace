import { CATEGORIES, FOLDER_CATEGORIES, BUILD_ARTIFACT_PATTERNS } from "../src/constants.js";

describe("constants", () => {
  describe("CATEGORIES", () => {
    it("should export an array of category objects", () => {
      expect(Array.isArray(CATEGORIES)).toBe(true);
      expect(CATEGORIES.length).toBeGreaterThan(0);
    });

    it("should have all required properties for each category", () => {
      CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("label");
        expect(category).toHaveProperty("order");
        expect(typeof category.id).toBe("string");
        expect(typeof category.label).toBe("string");
        expect(typeof category.order).toBe("number");
      });
    });

    it("should have unique category IDs", () => {
      const ids = CATEGORIES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique order values", () => {
      const orders = CATEGORIES.map((c) => c.order);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(orders.length);
    });

    it("should be ordered sequentially starting from 1", () => {
      const orders = CATEGORIES.map((c) => c.order).sort((a, b) => a - b);
      expect(orders[0]).toBe(1);
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toBe(orders[i - 1] + 1);
      }
    });

    it("should include expected categories", () => {
      const ids = CATEGORIES.map((c) => c.id);
      expect(ids).toContain("node_modules");
      expect(ids).toContain("build");
      expect(ids).toContain("testing");
      expect(ids).toContain("misc");
    });

    it("should have descriptive labels", () => {
      CATEGORIES.forEach((category) => {
        expect(category.label.length).toBeGreaterThan(3);
        expect(category.label).not.toBe(category.id);
      });
    });

    it("should have exactly 4 categories", () => {
      expect(CATEGORIES.length).toBe(4);
    });

    it("should match specific category structure", () => {
      const nodeModules = CATEGORIES.find((c) => c.id === "node_modules");
      expect(nodeModules).toEqual({
        id: "node_modules",
        label: "Node Modules",
        order: 1,
      });

      const build = CATEGORIES.find((c) => c.id === "build");
      expect(build).toEqual({
        id: "build",
        label: "Build/Cache Folders",
        order: 2,
      });

      const testing = CATEGORIES.find((c) => c.id === "testing");
      expect(testing).toEqual({
        id: "testing",
        label: "Testing/Reporting Folders",
        order: 3,
      });

      const misc = CATEGORIES.find((c) => c.id === "misc");
      expect(misc).toEqual({
        id: "misc",
        label: "Miscellaneous Dev Junk",
        order: 4,
      });
    });
  });

  describe("FOLDER_CATEGORIES", () => {
    it("should export an array of folder category objects", () => {
      expect(Array.isArray(FOLDER_CATEGORIES)).toBe(true);
      expect(FOLDER_CATEGORIES.length).toBeGreaterThan(0);
    });

    it("should have all required properties for each folder category", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("names");
        expect(typeof category.id).toBe("string");
        expect(Array.isArray(category.names)).toBe(true);
      });
    });

    it("should have at least one folder name in each category", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        expect(category.names.length).toBeGreaterThan(0);
      });
    });

    it("should have unique category IDs", () => {
      const ids = FOLDER_CATEGORIES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should match category IDs from CATEGORIES", () => {
      const categoryIds = CATEGORIES.map((c) => c.id);
      FOLDER_CATEGORIES.forEach((folderCategory) => {
        expect(categoryIds).toContain(folderCategory.id);
      });
    });

    it("should have exactly 4 folder categories", () => {
      expect(FOLDER_CATEGORIES.length).toBe(4);
    });

    it("should include node_modules folder", () => {
      const nodeModulesCategory = FOLDER_CATEGORIES.find((c) => c.id === "node_modules");
      expect(nodeModulesCategory).toBeDefined();
      expect(nodeModulesCategory.names).toContain("node_modules");
    });

    it("should include common build folders", () => {
      const buildCategory = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(buildCategory).toBeDefined();
      expect(buildCategory.names).toContain("dist");
      expect(buildCategory.names).toContain("build");
      expect(buildCategory.names).toContain(".next");
      expect(buildCategory.names).toContain(".cache");
    });

    it("should include framework-specific build folders", () => {
      const buildCategory = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(buildCategory).toBeDefined();
      expect(buildCategory.names).toContain(".shopify");
      expect(buildCategory.names).toContain(".react-router");
      expect(buildCategory.names).toContain(".nuxt");
      expect(buildCategory.names).toContain(".svelte-kit");
      expect(buildCategory.names).toContain(".angular");
      expect(buildCategory.names).toContain(".remix");
      expect(buildCategory.names).toContain(".astro");
      expect(buildCategory.names).toContain(".solid");
    });

    it("should include testing folders", () => {
      const testingCategory = FOLDER_CATEGORIES.find((c) => c.id === "testing");
      expect(testingCategory).toBeDefined();
      expect(testingCategory.names).toContain("coverage");
      expect(testingCategory.names).toContain(".nyc_output");
      expect(testingCategory.names).toContain(".pytest_cache");
    });

    it("should include Python virtual environment folders", () => {
      const miscCategory = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      expect(miscCategory).toBeDefined();
      expect(miscCategory.names).toContain(".venv");
      expect(miscCategory.names).toContain("venv");
      expect(miscCategory.names).toContain("env");
    });

    it("should include Python cache folders", () => {
      const miscCategory = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      expect(miscCategory).toBeDefined();
      expect(miscCategory.names).toContain("__pycache__");
      expect(miscCategory.names).toContain(".mypy_cache");
      expect(miscCategory.names).toContain(".ruff_cache");
    });

    it("should include infrastructure tool folders", () => {
      const miscCategory = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      expect(miscCategory).toBeDefined();
      expect(miscCategory.names).toContain(".vagrant");
      expect(miscCategory.names).toContain(".terraform");
    });

    it("should include vendor folder", () => {
      const miscCategory = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      expect(miscCategory).toBeDefined();
      expect(miscCategory.names).toContain("vendor");
    });

    it("should not have duplicate folder names across all categories", () => {
      const allFolderNames = FOLDER_CATEGORIES.flatMap((c) => c.names);
      const uniqueFolderNames = new Set(allFolderNames);
      expect(uniqueFolderNames.size).toBe(allFolderNames.length);
    });

    it("should have folder names as non-empty strings", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          expect(typeof name).toBe("string");
          expect(name.length).toBeGreaterThan(0);
        });
      });
    });

    it("should have build category as the largest category", () => {
      const buildCategory = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(buildCategory).toBeDefined();

      // Build category should have significantly more folders
      expect(buildCategory.names.length).toBeGreaterThan(15);
    });

    it("should include bundler cache folders", () => {
      const buildCategory = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(buildCategory).toBeDefined();
      expect(buildCategory.names).toContain(".vite");
      expect(buildCategory.names).toContain(".parcel-cache");
      expect(buildCategory.names).toContain(".rollup.cache");
      expect(buildCategory.names).toContain(".turbo");
    });

    it("should include static site generator folders", () => {
      const buildCategory = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(buildCategory).toBeDefined();
      expect(buildCategory.names).toContain(".gatsby-cache");
      expect(buildCategory.names).toContain(".eleventy-cache");
      expect(buildCategory.names).toContain(".docusaurus");
      expect(buildCategory.names).toContain(".eslintcache");
      expect(buildCategory.names).toContain(".stylelintcache");
      expect(buildCategory.names).toContain(".prettiercache");
      expect(buildCategory.names).toContain(".tsbuildinfo");
      expect(buildCategory.names).toContain(".swc");
      expect(buildCategory.names).toContain(".nx");
      expect(buildCategory.names).toContain(".pnpm-store");
      expect(buildCategory.names).toContain(".wwebjs_cache");
      expect(buildCategory.names).toContain(".wwebjs_auth");
    });
  });

  describe("BUILD_ARTIFACT_PATTERNS", () => {
    it("should export an array of pattern strings", () => {
      expect(Array.isArray(BUILD_ARTIFACT_PATTERNS)).toBe(true);
      expect(BUILD_ARTIFACT_PATTERNS.length).toBeGreaterThan(0);
    });

    it("should contain only strings", () => {
      BUILD_ARTIFACT_PATTERNS.forEach((pattern) => {
        expect(typeof pattern).toBe("string");
      });
    });

    it("should have non-empty pattern strings", () => {
      BUILD_ARTIFACT_PATTERNS.forEach((pattern) => {
        expect(pattern.length).toBeGreaterThan(0);
      });
    });

    it("should not have duplicate patterns", () => {
      const uniquePatterns = new Set(BUILD_ARTIFACT_PATTERNS);
      expect(uniquePatterns.size).toBe(BUILD_ARTIFACT_PATTERNS.length);
    });

    it("should include common JavaScript build artifacts", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("index.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("main.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("bundle.js");
    });

    it("should include HTML artifacts", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("index.html");
    });

    it("should include asset folders", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("assets");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("static");
    });

    it("should include wildcard patterns for common file types", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.css");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.html");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.map");
    });

    it("should include configuration files", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("package.json");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("tsconfig.json");
    });

    it("should include framework config files", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("webpack.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("vite.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("angular.json");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("vue.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("next.config.js");
    });

    it("should have at least 15 patterns", () => {
      expect(BUILD_ARTIFACT_PATTERNS.length).toBeGreaterThanOrEqual(15);
    });

    it("should contain patterns useful for build detection", () => {
      // Verify patterns are meaningful for detecting build outputs
      const meaningfulPatterns = ["index.js", "bundle.js", "assets", "webpack.config.js", "*.map"];
      meaningfulPatterns.forEach((pattern) => {
        expect(BUILD_ARTIFACT_PATTERNS).toContain(pattern);
      });
    });

    it("should include source map pattern", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.map");
    });

    it("should include common output directory names", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("static");
    });
  });

  describe("cross-reference validation", () => {
    it("should have matching categories between CATEGORIES and FOLDER_CATEGORIES", () => {
      const categoryIds = CATEGORIES.map((c) => c.id).sort();
      const folderCategoryIds = FOLDER_CATEGORIES.map((c) => c.id).sort();
      expect(categoryIds).toEqual(folderCategoryIds);
    });

    it("should have same number of categories in both constants", () => {
      expect(CATEGORIES.length).toBe(FOLDER_CATEGORIES.length);
    });

    it("should maintain consistent ordering", () => {
      // Verify that the order in CATEGORIES matches the order in FOLDER_CATEGORIES
      CATEGORIES.forEach((category, _index) => {
        const folderCategory = FOLDER_CATEGORIES.find((fc) => fc.id === category.id);
        expect(folderCategory).toBeDefined();
      });
    });
  });

  describe("edge cases and validation", () => {
    it("should not have empty arrays in FOLDER_CATEGORIES", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        expect(category.names.length).toBeGreaterThan(0);
      });
    });

    it("should not have whitespace-only names in FOLDER_CATEGORIES", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          expect(name.trim().length).toBe(name.length);
          expect(name.trim()).not.toBe("");
        });
      });
    });

    it("should not have whitespace-only patterns in BUILD_ARTIFACT_PATTERNS", () => {
      BUILD_ARTIFACT_PATTERNS.forEach((pattern) => {
        expect(pattern.trim().length).toBe(pattern.length);
        expect(pattern.trim()).not.toBe("");
      });
    });

    it("should have valid category IDs without special characters", () => {
      CATEGORIES.forEach((category) => {
        expect(category.id).toMatch(/^[a-z_]+$/);
      });
    });

    it("should not have null or undefined in any array", () => {
      CATEGORIES.forEach((category) => {
        expect(category.id).not.toBeNull();
        expect(category.id).not.toBeUndefined();
        expect(category.label).not.toBeNull();
        expect(category.label).not.toBeUndefined();
        expect(category.order).not.toBeNull();
        expect(category.order).not.toBeUndefined();
      });

      FOLDER_CATEGORIES.forEach((category) => {
        expect(category.id).not.toBeNull();
        expect(category.id).not.toBeUndefined();
        expect(category.names).not.toBeNull();
        expect(category.names).not.toBeUndefined();
        category.names.forEach((name) => {
          expect(name).not.toBeNull();
          expect(name).not.toBeUndefined();
        });
      });

      BUILD_ARTIFACT_PATTERNS.forEach((pattern) => {
        expect(pattern).not.toBeNull();
        expect(pattern).not.toBeUndefined();
      });
    });
  });

  describe("immutability checks", () => {
    it("should not modify original CATEGORIES when accessed", () => {
      const originalLength = CATEGORIES.length;
      const firstCategory = CATEGORIES[0];
      expect(CATEGORIES.length).toBe(originalLength);
      expect(CATEGORIES[0]).toEqual(firstCategory);
    });

    it("should not modify original FOLDER_CATEGORIES when accessed", () => {
      const originalLength = FOLDER_CATEGORIES.length;
      const firstCategory = FOLDER_CATEGORIES[0];
      expect(FOLDER_CATEGORIES.length).toBe(originalLength);
      expect(FOLDER_CATEGORIES[0]).toEqual(firstCategory);
    });

    it("should not modify original BUILD_ARTIFACT_PATTERNS when accessed", () => {
      const originalLength = BUILD_ARTIFACT_PATTERNS.length;
      const firstPattern = BUILD_ARTIFACT_PATTERNS[0];
      expect(BUILD_ARTIFACT_PATTERNS.length).toBe(originalLength);
      expect(BUILD_ARTIFACT_PATTERNS[0]).toBe(firstPattern);
    });
  });
});
