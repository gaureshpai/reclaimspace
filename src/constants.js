const CATEGORIES = [
  { id: "node_modules", label: "Node Modules", order: 1 },
  { id: "build", label: "Build/Cache Folders", order: 2 },
  { id: "testing", label: "Testing/Reporting Folders", order: 3 },
  { id: "misc", label: "Miscellaneous Dev Junk", order: 4 },
];

const FOLDER_CATEGORIES = [
  {
    id: "node_modules",
    names: ["node_modules"],
  },
  {
    id: "build",
    names: [
      ".next",
      "dist",
      "build",
      "storybook-static",
      ".nuxt",
      ".svelte-kit",
      ".angular",
      "out",
      ".expo",
      ".turbo",
      ".cache",
      ".shopify",
      ".react-router",
      ".tanstack",
    ],
  },
  {
    id: "testing",
    names: ["coverage", ".nyc_output"],
  },
  {
    id: "misc",
    names: [".venv"],
  },
];

const BUILD_ARTIFACT_PATTERNS = [
  "index.js",
  "main.js",
  "bundle.js",
  "index.html",
  "assets",
  "static",
  "*.map",
  "*.css",
  "*.js",
  "*.html",
  "package.json",
  "webpack.config.js",
  "vite.config.js",
  "angular.json",
  "vue.config.js",
  "next.config.js",
  "tsconfig.json",
];

export { CATEGORIES, FOLDER_CATEGORIES, BUILD_ARTIFACT_PATTERNS };
