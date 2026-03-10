import { CATEGORIES, FOLDER_CATEGORIES, BUILD_ARTIFACT_PATTERNS } from "../src/constants.js";

describe("constants", () => {
  describe("CATEGORIES", () => {
    it("should export CATEGORIES as an array", () => {
      expect(Array.isArray(CATEGORIES)).toBe(true);
    });

    it("should have the expected number of categories", () => {
      expect(CATEGORIES.length).toBe(4);
    });

    it("should have all categories with required properties", () => {
      CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("label");
        expect(category).toHaveProperty("order");
        expect(typeof category.id).toBe("string");
        expect(typeof category.label).toBe("string");
        expect(typeof category.order).toBe("number");
      });
    });

    it("should have unique IDs for each category", () => {
      const ids = CATEGORIES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(CATEGORIES.length);
    });

    it("should have unique orders for each category", () => {
      const orders = CATEGORIES.map((c) => c.order);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(CATEGORIES.length);
    });

    it("should have node_modules category with order 1", () => {
      const nodeModulesCategory = CATEGORIES.find((c) => c.id === "node_modules");
      expect(nodeModulesCategory).toBeDefined();
      expect(nodeModulesCategory.label).toBe("Node Modules");
      expect(nodeModulesCategory.order).toBe(1);
    });

    it("should have build category with order 2", () => {
      const buildCategory = CATEGORIES.find((c) => c.id === "build");
      expect(buildCategory).toBeDefined();
      expect(buildCategory.label).toBe("Build/Cache Folders");
      expect(buildCategory.order).toBe(2);
    });

    it("should have testing category with order 3", () => {
      const testingCategory = CATEGORIES.find((c) => c.id === "testing");
      expect(testingCategory).toBeDefined();
      expect(testingCategory.label).toBe("Testing/Reporting Folders");
      expect(testingCategory.order).toBe(3);
    });

    it("should have misc category with order 4", () => {
      const miscCategory = CATEGORIES.find((c) => c.id === "misc");
      expect(miscCategory).toBeDefined();
      expect(miscCategory.label).toBe("Miscellaneous Dev Junk");
      expect(miscCategory.order).toBe(4);
    });

    it("should be sorted by order", () => {
      for (let i = 1; i < CATEGORIES.length; i++) {
        expect(CATEGORIES[i].order).toBeGreaterThan(CATEGORIES[i - 1].order);
      }
    });
  });

  describe("FOLDER_CATEGORIES", () => {
    it("should export FOLDER_CATEGORIES as an array", () => {
      expect(Array.isArray(FOLDER_CATEGORIES)).toBe(true);
    });

    it("should have the expected number of folder categories", () => {
      expect(FOLDER_CATEGORIES.length).toBe(4);
    });

    it("should have all folder categories with required properties", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("names");
        expect(typeof category.id).toBe("string");
        expect(Array.isArray(category.names)).toBe(true);
        expect(category.names.length).toBeGreaterThan(0);
      });
    });

    it("should have unique category IDs", () => {
      const ids = FOLDER_CATEGORIES.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(FOLDER_CATEGORIES.length);
    });

    it("should have node_modules category with correct folder name", () => {
      const nodeModules = FOLDER_CATEGORIES.find((c) => c.id === "node_modules");
      expect(nodeModules).toBeDefined();
      expect(nodeModules.names).toContain("node_modules");
      expect(nodeModules.names.length).toBe(1);
    });

    it("should have build category with common build folders", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(build).toBeDefined();
      expect(build.names).toContain(".next");
      expect(build.names).toContain("dist");
      expect(build.names).toContain("build");
      expect(build.names).toContain(".nuxt");
      expect(build.names).toContain(".vite");
      expect(build.names).toContain(".shopify");
      expect(build.names).toContain(".react-router");
      expect(build.names.length).toBeGreaterThan(10);
    });

    it("should have testing category with common test folders", () => {
      const testing = FOLDER_CATEGORIES.find((c) => c.id === "testing");
      expect(testing).toBeDefined();
      expect(testing.names).toContain("coverage");
      expect(testing.names).toContain(".nyc_output");
      expect(testing.names).toContain(".pytest_cache");
      expect(testing.names).toContain(".tox");
      expect(testing.names).toContain("htmlcov");
    });

    it("should have misc category with various dev folders", () => {
      const misc = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      expect(misc).toBeDefined();
      expect(misc.names).toContain(".venv");
      expect(misc.names).toContain("venv");
      expect(misc.names).toContain("__pycache__");
      expect(misc.names).toContain("vendor");
      expect(misc.names).toContain(".vagrant");
      expect(misc.names).toContain(".terraform");
    });

    it("should not have duplicate folder names within a category", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        const uniqueNames = new Set(category.names);
        expect(uniqueNames.size).toBe(category.names.length);
      });
    });

    it("should have all folder names as strings", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          expect(typeof name).toBe("string");
          expect(name.length).toBeGreaterThan(0);
        });
      });
    });

    it("should match CATEGORIES IDs", () => {
      const categoryIds = new Set(CATEGORIES.map((c) => c.id));
      FOLDER_CATEGORIES.forEach((fc) => {
        expect(categoryIds.has(fc.id)).toBe(true);
      });
    });

    it("should include modern framework build folders", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      const modernFrameworks = [
        ".next", // Next.js
        ".nuxt", // Nuxt.js
        ".svelte-kit", // SvelteKit
        ".angular", // Angular
        ".expo", // Expo
        ".react-router", // React Router
        ".tanstack", // TanStack
        ".remix", // Remix
        ".astro", // Astro
        ".solid", // Solid
      ];
      modernFrameworks.forEach((framework) => {
        expect(build.names).toContain(framework);
      });
    });

    it("should include Python virtual environment folders", () => {
      const misc = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      expect(misc.names).toContain(".venv");
      expect(misc.names).toContain("venv");
      expect(misc.names).toContain("env");
    });

    it("should include Python cache folders", () => {
      const misc = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      expect(misc.names).toContain("__pycache__");
      expect(misc.names).toContain(".mypy_cache");
      expect(misc.names).toContain(".ruff_cache");
    });
  });

  describe("BUILD_ARTIFACT_PATTERNS", () => {
    it("should export BUILD_ARTIFACT_PATTERNS as an array", () => {
      expect(Array.isArray(BUILD_ARTIFACT_PATTERNS)).toBe(true);
    });

    it("should have multiple artifact patterns", () => {
      expect(BUILD_ARTIFACT_PATTERNS.length).toBeGreaterThan(5);
    });

    it("should have all patterns as strings", () => {
      BUILD_ARTIFACT_PATTERNS.forEach((pattern) => {
        expect(typeof pattern).toBe("string");
        expect(pattern.length).toBeGreaterThan(0);
      });
    });

    it("should not have duplicate patterns", () => {
      const uniquePatterns = new Set(BUILD_ARTIFACT_PATTERNS);
      expect(uniquePatterns.size).toBe(BUILD_ARTIFACT_PATTERNS.length);
    });

    it("should include common JavaScript entry points", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("index.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("main.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("bundle.js");
    });

    it("should include common HTML files", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("index.html");
    });

    it("should include common build directories", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("assets");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("static");
    });

    it("should include wildcard patterns for common file types", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.map");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.css");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.html");
    });

    it("should include common config files", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("package.json");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("webpack.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("vite.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("angular.json");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("vue.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("next.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("tsconfig.json");
    });

    it("should include TypeScript config", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("tsconfig.json");
    });

    it("should have patterns for source maps", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.map");
    });
  });

  describe("data integrity", () => {
    it("should maintain consistency between CATEGORIES and FOLDER_CATEGORIES", () => {
      const categoryIds = CATEGORIES.map((c) => c.id).sort();
      const folderCategoryIds = FOLDER_CATEGORIES.map((c) => c.id).sort();
      expect(folderCategoryIds).toEqual(categoryIds);
    });

    it("should have all category IDs present in both constants", () => {
      const categoryIdSet = new Set(CATEGORIES.map((c) => c.id));
      FOLDER_CATEGORIES.forEach((fc) => {
        expect(categoryIdSet.has(fc.id)).toBe(true);
      });
    });

    it("should not have empty arrays in FOLDER_CATEGORIES names", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        expect(category.names.length).toBeGreaterThan(0);
      });
    });

    it("should have proper ordering in CATEGORIES", () => {
      const orders = CATEGORIES.map((c) => c.order);
      const sortedOrders = [...orders].sort((a, b) => a - b);
      expect(orders).toEqual(sortedOrders);
    });
  });

  describe("specific framework support", () => {
    it("should support Shopify development folders", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(build.names).toContain(".shopify");
    });

    it("should support Turbo build folders", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(build.names).toContain(".turbo");
    });

    it("should support multiple bundler cache folders", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(build.names).toContain(".parcel-cache");
      expect(build.names).toContain(".rollup.cache");
      expect(build.names).toContain(".vite");
    });

    it("should support static site generators", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(build.names).toContain(".docusaurus");
      expect(build.names).toContain(".eleventy-cache");
      expect(build.names).toContain(".gatsby-cache");
    });
  });

  describe("edge cases and validation", () => {
    it("should not have null or undefined values in CATEGORIES", () => {
      CATEGORIES.forEach((category) => {
        expect(category).not.toBeNull();
        expect(category).not.toBeUndefined();
        expect(category.id).not.toBeNull();
        expect(category.id).not.toBeUndefined();
        expect(category.label).not.toBeNull();
        expect(category.label).not.toBeUndefined();
      });
    });

    it("should not have empty strings in category IDs", () => {
      CATEGORIES.forEach((category) => {
        expect(category.id.trim()).toBe(category.id);
        expect(category.id.length).toBeGreaterThan(0);
      });
    });

    it("should not have empty strings in folder names", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          expect(name.length).toBeGreaterThan(0);
        });
      });
    });

    it("should have valid order numbers (positive integers)", () => {
      CATEGORIES.forEach((category) => {
        expect(category.order).toBeGreaterThan(0);
        expect(Number.isInteger(category.order)).toBe(true);
      });
    });

    it("should not have whitespace-only folder names", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          expect(name.trim().length).toBeGreaterThan(0);
        });
      });
    });

    it("should not have whitespace-only patterns", () => {
      BUILD_ARTIFACT_PATTERNS.forEach((pattern) => {
        expect(pattern.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe("regression and boundary tests", () => {
    it("should not have circular references in data structures", () => {
      // Attempt to stringify - will throw on circular refs
      expect(() => JSON.stringify(CATEGORIES)).not.toThrow();
      expect(() => JSON.stringify(FOLDER_CATEGORIES)).not.toThrow();
      expect(() => JSON.stringify(BUILD_ARTIFACT_PATTERNS)).not.toThrow();
    });

    it("should have consistent casing in category IDs", () => {
      CATEGORIES.forEach((category) => {
        // All IDs should be lowercase with underscores
        expect(category.id).toBe(category.id.toLowerCase());
      });
    });

    it("should not have leading or trailing slashes in folder names", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          expect(name.startsWith("/")).toBe(false);
          expect(name.endsWith("/")).toBe(false);
        });
      });
    });

    it("should have folder names that are valid path components", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          // Should not contain path separators
          expect(name.includes("\\")).toBe(false);
          // Allow forward slash only in specific cases like "public/build"
          if (name.includes("/")) {
            expect(name).toBe("public/build");
          }
        });
      });
    });

    it("should have reasonable string lengths for all values", () => {
      CATEGORIES.forEach((category) => {
        expect(category.id.length).toBeLessThan(50);
        expect(category.label.length).toBeLessThan(100);
      });

      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          expect(name.length).toBeLessThan(50);
        });
      });

      BUILD_ARTIFACT_PATTERNS.forEach((pattern) => {
        expect(pattern.length).toBeLessThan(50);
      });
    });

    it("should not have duplicate entries across different categories", () => {
      const allFolderNames = new Set();
      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          expect(allFolderNames.has(name)).toBe(false);
          allFolderNames.add(name);
        });
      });
    });

    it("should have build category as the largest category", () => {
      const buildCategory = FOLDER_CATEGORIES.find((c) => c.id === "build");
      FOLDER_CATEGORIES.forEach((category) => {
        if (category.id !== "build") {
          expect(buildCategory.names.length).toBeGreaterThanOrEqual(category.names.length);
        }
      });
    });

    it("should contain commonly used patterns in BUILD_ARTIFACT_PATTERNS", () => {
      // These are must-have patterns for build detection
      const mustHave = ["*.js", "*.html", "*.css"];
      mustHave.forEach((pattern) => {
        expect(BUILD_ARTIFACT_PATTERNS).toContain(pattern);
      });
    });

    it("should have node_modules as the first category by order", () => {
      const firstCategory = CATEGORIES.reduce((min, cat) =>
        cat.order < min.order ? cat : min
      );
      expect(firstCategory.id).toBe("node_modules");
    });

    it("should not have overlapping folder names between categories", () => {
      const nameToCategory = {};
      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          if (nameToCategory[name]) {
            fail(`Folder name "${name}" appears in both ${nameToCategory[name]} and ${category.id}`);
          }
          nameToCategory[name] = category.id;
        });
      });
    });

    it("should include both leading-dot and non-leading-dot variants where appropriate", () => {
      const misc = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      // Check for venv variants
      expect(misc.names).toContain(".venv");
      expect(misc.names).toContain("venv");
      expect(misc.names).toContain("env");
    });

    it("should include cache-related folders in build category", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      const cacheNames = build.names.filter(name =>
        name.includes("cache") || name.includes("Cache")
      );
      expect(cacheNames.length).toBeGreaterThan(3);
    });

    it("should support Next.js related folders", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(build.names).toContain(".next");
    });

    it("should support Vue ecosystem", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(build.names).toContain(".nuxt");
    });

    it("should have config files in artifact patterns", () => {
      const configPatterns = BUILD_ARTIFACT_PATTERNS.filter(p =>
        p.includes("config") || p.includes(".json")
      );
      expect(configPatterns.length).toBeGreaterThan(3);
    });

    it("should export as arrays that can be safely iterated", () => {
      // Test that exports are proper arrays
      expect(Array.isArray(CATEGORIES)).toBe(true);
      expect(Array.isArray(FOLDER_CATEGORIES)).toBe(true);
      expect(Array.isArray(BUILD_ARTIFACT_PATTERNS)).toBe(true);

      // Test that we can make defensive copies
      const categoriesCopy = [...CATEGORIES];
      expect(categoriesCopy.length).toBe(CATEGORIES.length);
    });

    it("should have all artifact patterns be valid glob patterns or filenames", () => {
      BUILD_ARTIFACT_PATTERNS.forEach((pattern) => {
        // Should not have invalid characters for file systems
        expect(pattern).not.toContain("\0");
        expect(pattern).not.toContain("\n");
        expect(pattern).not.toContain("\r");
      });
    });

    it("should have testing category with Python-related folders", () => {
      const testing = FOLDER_CATEGORIES.find((c) => c.id === "testing");
      const pythonFolders = testing.names.filter(name =>
        name.includes("pytest") || name.includes("tox") || name.includes("cov")
      );
      expect(pythonFolders.length).toBeGreaterThanOrEqual(3);
    });
  });
});