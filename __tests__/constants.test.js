import { CATEGORIES, FOLDER_CATEGORIES, BUILD_ARTIFACT_PATTERNS } from "../src/constants.js";

describe("constants", () => {
  describe("CATEGORIES", () => {
    it("should be an array", () => {
      expect(Array.isArray(CATEGORIES)).toBe(true);
    });

    it("should have the expected number of categories", () => {
      expect(CATEGORIES.length).toBe(4);
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

    it("should contain node_modules category", () => {
      const nodeModules = CATEGORIES.find((c) => c.id === "node_modules");
      expect(nodeModules).toBeDefined();
      expect(nodeModules.label).toBe("Node Modules");
      expect(nodeModules.order).toBe(1);
    });

    it("should contain build category", () => {
      const build = CATEGORIES.find((c) => c.id === "build");
      expect(build).toBeDefined();
      expect(build.label).toBe("Build/Cache Folders");
      expect(build.order).toBe(2);
    });

    it("should contain testing category", () => {
      const testing = CATEGORIES.find((c) => c.id === "testing");
      expect(testing).toBeDefined();
      expect(testing.label).toBe("Testing/Reporting Folders");
      expect(testing.order).toBe(3);
    });

    it("should contain misc category", () => {
      const misc = CATEGORIES.find((c) => c.id === "misc");
      expect(misc).toBeDefined();
      expect(misc.label).toBe("Miscellaneous Dev Junk");
      expect(misc.order).toBe(4);
    });

    it("should be ordered sequentially", () => {
      const orders = CATEGORIES.map((c) => c.order);
      for (let i = 0; i < orders.length; i++) {
        expect(orders[i]).toBe(i + 1);
      }
    });
  });

  describe("FOLDER_CATEGORIES", () => {
    it("should be an array", () => {
      expect(Array.isArray(FOLDER_CATEGORIES)).toBe(true);
    });

    it("should have the same number of entries as CATEGORIES", () => {
      expect(FOLDER_CATEGORIES.length).toBe(CATEGORIES.length);
    });

    it("should have all required properties for each folder category", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("names");
        expect(typeof category.id).toBe("string");
        expect(Array.isArray(category.names)).toBe(true);
      });
    });

    it("should have matching IDs with CATEGORIES", () => {
      const categoryIds = CATEGORIES.map((c) => c.id).sort();
      const folderCategoryIds = FOLDER_CATEGORIES.map((c) => c.id).sort();
      expect(folderCategoryIds).toEqual(categoryIds);
    });

    it("should have non-empty names arrays", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        expect(category.names.length).toBeGreaterThan(0);
      });
    });

    it("should have string values in names arrays", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          expect(typeof name).toBe("string");
          expect(name.length).toBeGreaterThan(0);
        });
      });
    });

    it("should contain node_modules in node_modules category", () => {
      const nodeModules = FOLDER_CATEGORIES.find((c) => c.id === "node_modules");
      expect(nodeModules).toBeDefined();
      expect(nodeModules.names).toContain("node_modules");
    });

    it("should contain common build folders", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(build).toBeDefined();
      expect(build.names).toContain("dist");
      expect(build.names).toContain("build");
      expect(build.names).toContain(".next");
    });

    it("should contain framework-specific build folders", () => {
      const build = FOLDER_CATEGORIES.find((c) => c.id === "build");
      expect(build).toBeDefined();
      expect(build.names).toContain(".shopify");
      expect(build.names).toContain(".react-router");
      expect(build.names).toContain(".tanstack");
      expect(build.names).toContain(".vite");
      expect(build.names).toContain(".astro");
    });

    it("should contain testing folders", () => {
      const testing = FOLDER_CATEGORIES.find((c) => c.id === "testing");
      expect(testing).toBeDefined();
      expect(testing.names).toContain("coverage");
      expect(testing.names).toContain(".nyc_output");
      expect(testing.names).toContain(".pytest_cache");
    });

    it("should contain Python-related folders in misc", () => {
      const misc = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      expect(misc).toBeDefined();
      expect(misc.names).toContain(".venv");
      expect(misc.names).toContain("venv");
      expect(misc.names).toContain("__pycache__");
      expect(misc.names).toContain(".mypy_cache");
    });

    it("should contain infrastructure tool folders in misc", () => {
      const misc = FOLDER_CATEGORIES.find((c) => c.id === "misc");
      expect(misc).toBeDefined();
      expect(misc.names).toContain(".vagrant");
      expect(misc.names).toContain(".terraform");
    });

    it("should not have duplicate folder names within a category", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        const uniqueNames = new Set(category.names);
        expect(uniqueNames.size).toBe(category.names.length);
      });
    });

    it("should not have duplicate folder names across categories", () => {
      const allNames = FOLDER_CATEGORIES.flatMap((c) => c.names);
      const uniqueNames = new Set(allNames);
      expect(uniqueNames.size).toBe(allNames.length);
    });
  });

  describe("BUILD_ARTIFACT_PATTERNS", () => {
    it("should be an array", () => {
      expect(Array.isArray(BUILD_ARTIFACT_PATTERNS)).toBe(true);
    });

    it("should have at least one pattern", () => {
      expect(BUILD_ARTIFACT_PATTERNS.length).toBeGreaterThan(0);
    });

    it("should contain only strings", () => {
      BUILD_ARTIFACT_PATTERNS.forEach((pattern) => {
        expect(typeof pattern).toBe("string");
        expect(pattern.length).toBeGreaterThan(0);
      });
    });

    it("should contain common JavaScript build artifacts", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("index.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("main.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("bundle.js");
    });

    it("should contain common web build artifacts", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("index.html");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("assets");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("static");
    });

    it("should contain file extension patterns", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.map");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.css");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("*.html");
    });

    it("should contain common config files", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("package.json");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("webpack.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("vite.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("next.config.js");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("tsconfig.json");
    });

    it("should contain framework-specific config files", () => {
      expect(BUILD_ARTIFACT_PATTERNS).toContain("angular.json");
      expect(BUILD_ARTIFACT_PATTERNS).toContain("vue.config.js");
    });

    it("should not have duplicate patterns", () => {
      const uniquePatterns = new Set(BUILD_ARTIFACT_PATTERNS);
      expect(uniquePatterns.size).toBe(BUILD_ARTIFACT_PATTERNS.length);
    });
  });

  describe("integration", () => {
    it("should have every FOLDER_CATEGORIES id represented in CATEGORIES", () => {
      FOLDER_CATEGORIES.forEach((folderCat) => {
        const matchingCategory = CATEGORIES.find((c) => c.id === folderCat.id);
        expect(matchingCategory).toBeDefined();
      });
    });

    it("should have every CATEGORIES id represented in FOLDER_CATEGORIES", () => {
      CATEGORIES.forEach((category) => {
        const matchingFolderCat = FOLDER_CATEGORIES.find((c) => c.id === category.id);
        expect(matchingFolderCat).toBeDefined();
      });
    });

    it("should maintain consistent category structure", () => {
      const categoryIds = ["node_modules", "build", "testing", "misc"];
      const actualIds = CATEGORIES.map((c) => c.id);
      expect(actualIds).toEqual(categoryIds);
    });
  });

  describe("data validation", () => {
    it("should have no empty strings in folder names", () => {
      FOLDER_CATEGORIES.forEach((category) => {
        category.names.forEach((name) => {
          expect(name.trim()).toBe(name);
          expect(name).not.toBe("");
        });
      });
    });

    it("should have no empty strings in build artifact patterns", () => {
      BUILD_ARTIFACT_PATTERNS.forEach((pattern) => {
        expect(pattern.trim()).toBe(pattern);
        expect(pattern).not.toBe("");
      });
    });

    it("should have positive order values in CATEGORIES", () => {
      CATEGORIES.forEach((category) => {
        expect(category.order).toBeGreaterThan(0);
      });
    });

    it("should have non-empty labels in CATEGORIES", () => {
      CATEGORIES.forEach((category) => {
        expect(category.label.trim()).toBe(category.label);
        expect(category.label.length).toBeGreaterThan(0);
      });
    });
  });
});