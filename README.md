# ReclaimSpace CLI

<div  align="center">
  <p>
    <a href="https://www.npmjs.com/package/reclaimspace"><img src="https://img.shields.io/npm/v/reclaimspace.svg" alt="npm version"></a>
    <a href="https://github.com/gaureshpai/reclaimspace/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/reclaimspace.svg" alt="license"></a>
    <a href="https://www.npmjs.com/package/reclaimspace"><img src="https://img.shields.io/npm/dt/reclaimspace.svg" alt="npm downloads"></a>
    <a href="https://gaureshpai.github.io/reclaimspace/"><img src="https://img.shields.io/badge/documentation-site-green.svg" alt="documentation site"></a>
    <a href="https://www.npmjs.com/package/reclaimspace"><img src="https://img.shields.io/badge/npm-reclaimspace-cb3837.svg" alt="npm package"></a>
    <a href="https://github.com/gaureshpai/reclaimspace"><img src="https://img.shields.io/github/stars/gaureshpai/reclaimspace?style=social" alt="github stars"></a>
  </p>
</div>

**A lightning-fast, zero-dependency CLI tool to reclaim disk space by finding and removing unnecessary development folders and files.**

It behaves like `npx npkill`, but goes further by detecting multiple categories of heavy folders/files, providing a navigable grouped CLI, and focusing on modern tech stacks like Shopify and React Router—all without a single runtime dependency.

## Usage

Here are some common ways to use `reclaimspace`:

**To interactively select and delete items (default):**

This is the default behavior. It lists all the folders, and you can select which ones to delete.

```bash
npx reclaimspace
```

**To directly delete everything (auto-delete):**

This will find all reclaimable items and delete them automatically without confirmation.

```bash
npx reclaimspace --yes
```

**To see what would be deleted (dry run):**

This will list all the items that can be deleted but won't actually delete anything.

```bash
npx reclaimspace --dry
```

**To run in a specific folder:**

You can specify one or more directories to scan.

```bash
npx reclaimspace <foldername>
```

**To combine flags and folders:**

You can combine any of the flags with a specific folder. For example, to auto-delete all items in the `my-project` directory:

```bash
npx reclaimspace --yes my-project
```

**To enable build analysis:**

This will enable build analysis logs.

```bash
npx reclaimspace --build-analysis
```

**To ignore certain folders:**

You can exclude folders from the scan by providing a comma-separated list of patterns.

```bash
npx reclaimspace --ignore "node_modules,dist"
```

**To include only specific folders:**

You can specify a comma-separated list of patterns to include in the scan. When this flag is used, only folders matching these patterns will be considered, overriding the default detected items.

```bash
npx reclaimspace --include "my-custom-build,temp-files"
```

## Configuration

You can create a `.reclaimspacerc` file in the root of your project to specify folders and patterns to ignore. This is useful for excluding project-specific build folders or other directories that you don't want to be scanned.

Example `.reclaimspacerc` file:

```
# Ignore all node_modules folders
node_modules

# Ignore a specific build folder
my-project/dist
```

## Features

- **Interactive Deletion:** Navigate through a list of found items using arrow keys, space to select, and Enter to proceed.
- **Zero Runtime Dependencies:** Built from the ground up with native Node.js APIs for maximum speed and security. No `node_modules` at runtime!
- **Categorized & Grouped:** Results are grouped by type (Node Modules, Build Folders, etc.) for clarity.
- **Size Information:** See the size of each item and the total reclaimable space.
- **Concurrent Scanning:** ReclaimSpace uses a concurrent scanner to quickly find and process files.
- **Build Artifact Detection:** It intelligently detects build folders by looking for common build artifacts.
- **Auto-Delete Mode:** Use the `--yes` flag to delete all found items without confirmation.
- **Dry Run Mode:** Use the `--dry` flag to see what would be deleted without actually deleting anything.
- **Ignore Patterns:** Exclude specific folders or patterns using a `.reclaimspacerc` file or the `--ignore` flag.
- **Interactive UI:** Supports 'a' to select all and 'i' to invert selection.
- **Cool Logo:** Displays a cool logo when you run the tool.

## Detected Items

`reclaimspace` detects the following categories:

1.  **Node Modules**
    - `node_modules`
2.  **Build/Cache Folders**
    - `.next`, `dist`, `build`, `storybook-static`, `.nuxt`, `.output`, `.svelte-kit`, `.angular`, `out`, `.expo`, `.turbo`, `.cache`, `.shopify`, `.react-router`, `.tanstack`
    - `.rollup.cache`, `.parcel-cache`, `.vite`, `.astro`, `.solid`, `.remix`, `.docusaurus`, `.eleventy-cache`, `.gatsby-cache`
    - `public/build`, `.vercel`, `.netlify`
3.  **Testing/Reporting Folders**
    - `coverage`, `.nyc_output`, `.pytest_cache`, `.tox`, `htmlcov`
4.  **Miscellaneous Dev Junk**
    - `.venv`, `venv`, `env` (Python Virtual Environments)
    - `__pycache__`, `.mypy_cache`, `.ruff_cache` (Python caches)
    - `vendor` (Go/PHP dependencies)
    - `.vagrant`, `.terraform` (Infrastructure tools)


## Contributing

Contributions are welcome! Please read our [contributing guidelines](./CONTRIBUTING.md) to get started.

## Contributors

<div align="center">
  <a href="https://github.com/gaureshpai/reclaimspace/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=gaureshpai/reclaimspace" />
  </a>
</div>

## License

This project is licensed under the ISC License. See the [LICENSE](./LICENSE) file for details.
