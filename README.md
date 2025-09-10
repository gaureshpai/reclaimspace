# ReclaimSpace CLI

**A CLI tool to reclaim disk space by finding and removing unnecessary development folders and files.**

It behaves like `npx npkill`, but goes further by detecting multiple categories of heavy folders/files and providing a navigable, grouped CLI interface.

## Usage

Here are some common ways to use `reclaimspace`:

**To interactively select and delete items:**

This is the default behavior. It lists all the folders, and you can select which ones to delete.

```bash
npx reclaimspace
```

**To directly delete everything (auto-delete):**

This will find all reclaimable items and delete them automatically without confirmation. The flag for this is `--yes`.

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

**To ignore certain folders:**

You can exclude folders from the scan by providing a comma-separated list of patterns.

```bash
npx reclaimspace --ignore "node_modules,dist"
```

## Why ReclaimSpace?

As developers, we often have multiple projects on our machines, each with its own set of dependencies and build artifacts. Over time, these files can accumulate and consume a significant amount of disk space. ReclaimSpace helps you identify and remove these unnecessary files, freeing up valuable disk space and keeping your development environment clean.

## Features

- **Interactive Deletion:** Navigate through a list of found items using arrow keys and press Enter to delete.
- **Categorized & Grouped:** Results are grouped by type (Node Modules, Build Folders, etc.) for clarity.
- **Size Information:** See the size of each item and the total reclaimable space.
- **Concurrent Scanning:** ReclaimSpace uses a concurrent scanner to quickly find and process files.
- **Build Artifact Detection:** It intelligently detects build folders by looking for common build artifacts.
- **Auto-Delete Mode:** Use the `--yes` flag to delete all found items without confirmation.
- **Dry Run Mode:** Use the `--dry` flag to see what would be deleted without actually deleting anything.
- **Ignore Patterns:** Exclude specific folders or patterns using a configuration file.

## Detected Items

`reclaimspace` detects the following categories:

1.  **Node Modules**
    - `node_modules`
2.  **Build/Cache Folders**
    - `.next`, `dist`, `build`, `storybook-static`, `.nuxt`, `.svelte-kit`, `.angular`, `out`, `.expo`, `.turbo`, `.cache`
3.  **Testing/Reporting Folders**
    - `coverage`, `.nyc_output`

## Contributing

Contributions are welcome! Please read our [contributing guidelines](./CONTRIBUTING.md) to get started.

## License

This project is licensed under the ISC License. See the [LICENSE](./LICENSE) file for details.
