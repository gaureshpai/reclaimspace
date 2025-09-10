const CATEGORIES = [
  { id: 'node_modules', label: 'Node Modules', order: 1 },
  { id: 'build', label: 'Build/Cache Folders', order: 2 },
  { id: 'testing', label: 'Testing/Reporting Folders', order: 3 },
  { id: 'misc', label: 'Miscellaneous Dev Junk', order: 4 },
];

const FOLDER_CATEGORIES = [
  {
    id: 'node_modules',
    names: ['node_modules'],
  },
  {
    id: 'build',
    names: [
      '.next', 'dist', 'build', 'storybook-static', '.nuxt', '.svelte-kit',
      '.angular', 'out', '.expo', '.turbo', '.cache'
    ],
  },
  {
    id: 'testing',
    names: ['coverage', '.nyc_output'],
  },
];

const BUILD_ARTIFACT_PATTERNS = [
  'index.js',
  'main.js',
  'bundle.js',
  'index.html',
  'assets',
  'static',
  '*.map',
  '*.css',
  '*.js',
  '*.html',
];

const FILE_CATEGORIES = {
    id: 'misc',
    patterns: ['*.log', '.DS_Store', 'Thumbs.db']
};

export { 
  CATEGORIES,
  FOLDER_CATEGORIES,
  FILE_CATEGORIES,
  BUILD_ARTIFACT_PATTERNS
};