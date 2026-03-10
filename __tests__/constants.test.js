import { CATEGORIES, FOLDER_CATEGORIES, BUILD_ARTIFACT_PATTERNS } from "../src/constants.js";

describe("constants", () => {
  describe("CATEGORIES", () => {
    it("should export an array of category objects", () => {
      expect(Array.isArray(CATEGORIES)).toBe(true);
      expect(CATEGORIES.length).toBeGreaterThan(0);
    });

    it("should have required properties on each category", () => {
      CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("label");
        expect(category).toHaveProperty("order");
        expect(typeof category.id).toBe("string");
        expect(typeof category.label).toBe("string");
        expect(typeof category.order).toBe("number");
      });
    });

    it("should contain node_modules category", () => {
      const nodeModulesCategory = CATEGORIES.find((c) => c.id === "node_modules");
      expect(nodeModulesCategory).toBeDefined();
      expect(nodeModulesCategory.label).toBe("Node Modules");
      expect(nodeModulesCategory.order).toBe(1);
    });

    it("should contain build category", () => {
      const buildCategory = CATEGORIES.find((c) => c.id === "build");
      expect(buildCategory).toBeDefined();
      expect(buildCategory.label).toBe("Build/Cache Folders");
      expect(buildCategory.order).toBe(2);
    });

    it("should contain testing category", () => {
      const testingCategory = CATEGORIES.find((c) => c.id === "testing");
      expect(testingCategory).toBeDefined();
      expect(testingCategory.label).toBe("Testing/Reporting Folders");
      expect(testingCategory.order).toBe(3);
    });

    it("should contain misc category", () => {
      const miscCategory = CATEGORIES.find((c) => c.id === "misc");
      expect(miscCategory).toBeDefined();
      expect(miscCategory.label).toBe("Miscellaneous Dev Junk");
      expect(miscCategory.order).toBe(4);
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

    it("should have sequential order values starting from 1", () => {
      const orders = CATEGORIES.map((c) => c.order).sort((a, b) => a - b);
      orders.forEach((order, index) => {
        expect(order).toBe(index + 1);
      });
    });

    it("should have exactly 4 categories", () => {
      expect(CATEGORIES.length).toBe(4);
    });
  });

  describe("FOLDER_CATEGORIES", () => {
    it("should export an array of folder category objects", () => {
      expect(Array.isArray(FOLDER_CATEGORIES)).toBe(true);
      expect(FOLDER_CATEGORIES.length).toBeGreaterThan(0);
    });

    it("should have required properties on each folder category", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("names");
        expect(typeof category.id).toBe("string");
        expect(Array.isArray(category.names)).toBe(true);
      });
    });

    it("should have node_modules folder category", () => {
      const nodeModules = FOLDER_CATEGORIES.find((c) => c.id === "node_modules");
      expect(nodeModules).toBeDefined();
      expect(nodeModules.names).toContain("node_modules");
      expect(nodeModules.names.length).toBe(1);
    });

    it("should have build folder category with common build folders", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(build).toBeDefined();
      expect(build.names).toContain(".next");
      expect(build.names).toContain("dist");
      expect(build.names).toContain("build");
      expect(build.names).toContain(".nuxt");
      expect(build.names).toContain(".vite");
      expect(build.names).toContain(".cache");
    });

    it("should have build folder category with modern framework folders", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(build.names).toContain(".shopify");
      expect(build.names).toContain(".react-router");
      expect(build.names).toContain(".tanstack");
      expect(build.names).toContain(".svelte-kit");
      expect(build.names).toContain(".remix");
      expect(build.names).toContain(".astro");
    });

    it("should have testing folder category", () => {
      const testing = FOLDER_CATEGORIES.find((c) => c.id === "testing");
      expect(testing).toBeDefined();
      expect(testing.names).toContain("coverage");
      expect(testing.names).toContain(".nyc_output");
      expect(testing.names).toContain(".pytest_cache");
      expect(testing.names).toContain(".tox");
      expect(testing.names).toContain("htmlcov");
    });

    it("should have misc folder category with Python virtual environments", () => {
      const misc = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      expect(misc).toBeDefined();
      expect(misc.names).toContain(".venv");
      expect(misc.names).toContain("venv");
      expect(misc.names).toContain("env");
    });

    it("should have misc folder category with Python cache folders", () => {
      const misc = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      expect(misc.names).toContain("__pycache__");
      expect(misc.names).toContain(".mypy_cache");
      expect(misc.names).toContain(".ruff_cache");
    });

    it("should have misc folder category with infrastructure tools", () => {
      const misc = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      expect(misc.names).toContain("vendor");
      expect(misc.names).toContain(".vagrant");
      expect(misc.names).toContain(".terraform");
    });

    it("should have unique category IDs", () => {
      const ids = FOLDER_CATEGORIES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique folder names across all categories", () => {
      const allNames = FOLDER_CATEGORIES.flatMap((c) => c.names);
      const uniqueNames = new Set(allNames);
      expect(uniqueNames.size).toBe(allNames.length);
    });

    it("should have at least one folder name per category", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        expect(category.names.length).toBeGreaterThan(0);
      });
    });

    it("should have all folder names as non-empty strings", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          expect(typeof name).toBe("string");
          expect(name.length).toBeGreaterThan(0);
        });
      });
    });

    it("should have matching IDs with CATEGORIES", () => {
      const categoryIds = new Set(CATEGORIES.map((c) => c.id));
      FOLDER_CATEGORIES.forEach((folderCategory) => {
        expect(categoryIds.has(folderCategory.id)).toBe(true);
      });
    });

    it("should have exactly 4 folder categories", () => {
      expect(FOLDER_CATEGORIES.length).toBe(4);
    });
  });

  describe("BUILD_ARTIFACT_PATTERNS", () => {
    it("should export an array of pattern strings", () => {
      expect(Array.isArray(BUILD_ARTIFACT_PATTERNS)).toBe(true);
      expect(BUILD_ARTIFACT_PATTERNS.length).toBeGreaterThan(0);
    });

    it("should contain common JavaScript build artifacts", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("index.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("main.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("bundle.js");
    });

    it("should contain common web artifacts", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("index.html");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("assets");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("static");
    });

    it("should contain wildcard patterns for common file types", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.map");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.css");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.html");
    });

    it("should contain common configuration files", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("package.json");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("webpack.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("vite.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("angular.json");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("vue.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("next.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("tsconfig.json");
    });

    it("should have all patterns as non-empty strings", () => {
      BUILD_ARTIFACT_PATTERNS.forEach((pattern) => {
        expect(typeof pattern).toBe("string");
        expect(pattern.length).toBeGreaterThan(0);
      });
    });

    it("should have unique patterns", () => {
      const uniquePatterns = new Set(BUILD_ARTIFACT_PATTERNS);
      expect(uniquePatterns.size).toBe(BUILD_ARTIFACT_PATTERNS.length);
    });

    it("should contain modern framework config files", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("next.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("vite.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("angular.json");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("vue.config.js");
    });

    it("should contain TypeScript config file", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("tsconfig.json");
    });
  });

  describe("integration between exports", () => {
    it("should have FOLDER_CATEGORIES that map to CATEGORIES", () => {
      const categoryIds = new Set(CATEGORIES.map((c) => c.id));
      const folderCategoryIds = new Set(FOLDER_CATEGORIES.map((fc) => fc.id));

      expect(folderCategoryIds.size).toBe(categoryIds.size);
      folderCategoryIds.forEach((id) => {
        expect(categoryIds.has(id)).toBe(true);
      });
    });

    it("should have same number of categories in both exports", () => {
      expect(FOLDER_CATEGORIES.length).toBe(CATEGORIES.length);
    });
  });

  describe("data integrity", () => {
    it("should not have duplicate folder names", () => {
      const allNames = FOLDER_CATEGORIES.flatMap((c) => c.names);
      const duplicates = allNames.filter((name, index) => allNames.indexOf(name) !== index);
      expect(duplicates).toEqual([]);
    });

    it("should have consistent category structure", () => {
      expect(CATEGORIES.length).toBe(FOLDER_CATEGORIES.length);

      CATEGORIES.forEach((category) => {
        const folderCategory = FOLDER_CATEGORIES.find((fc) => fc.id === category.id);
        expect(folderCategory).toBeDefined();
      });
    });
  });

  describe("specific folder validation", () => {
    it("should include all modern JavaScript framework build folders", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      const modernFrameworks = [
        ".next",
        ".nuxt",
        ".svelte-kit",
        ".angular",
        ".expo",
        ".remix",
        ".astro",
        ".solid",
        ".gatsby-cache",
        ".docusaurus",
      ];

      modernFrameworks.forEach((framework) => {
        expect(build.names).toContain(framework);
      });
    });

    it("should include bundler-specific cache folders", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      const bundlerCaches = [".vite", ".parcel-cache", ".rollup.cache", ".turbo"];

      bundlerCaches.forEach((cache) => {
        expect(build.names).toContain(cache);
      });
    });

    it("should include all Python testing and cache folders", () => {
      const testing = FOLDER_CATEGORIES.find((c) => c.id === "testing");
      const misc = FOLDER_CATEGORIES.find((c) => c.id === "misc");

      expect(testing.names).toContain(".pytest_cache");
      expect(testing.names).toContain(".tox");
      expect(misc.names).toContain("__pycache__");
      expect(misc.names).toContain(".mypy_cache");
      expect(misc.names).toContain(".ruff_cache");
    });
  });

  describe("regression tests", () => {
    it("should maintain backward compatibility with exact category count", () => {
      expect(CATEGORIES).toHaveLength(4);
      expect(FOLDER_CATEGORIES).toHaveLength(4);
    });

    it("should maintain core folder names for node_modules", () => {
      const nodeModules = FOLDER_CATEGORIES.find((c) => c.id === "node_modules");
      expect(nodeModules.names).toEqual(["node_modules"]);
    });

    it("should maintain minimum build artifact patterns count", () => {
      expect(BUILD_ARTIFACT_PATTERNS.length).toBeGreaterThanOrEqual(15);
    });
  });
});