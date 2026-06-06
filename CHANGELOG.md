# Changelog

## 2026-06-06

> **Release: v0.2.4 - 2026-06-06**

- **Descriptive Reasons in `--deep-clean` Output** ([#54](https://github.com/gaureshpai/reclaimspace/issues/54)):
  - When cache size is unchanged after cleaning, a human-readable explanation is now shown (e.g., pnpm's `store prune` only removes unreferenced packages; npm recreates essential metadata after cleaning).
  - Added before→after size summary when space is successfully freed (e.g., `1.31 GB → 12.94 KB`).
  - Added descriptive messages when cache is already empty, per package manager.

- **Short Flag `-dc` for `--deep-clean`** ([#55](https://github.com/gaureshpai/reclaimspace/issues/55)):
  - Users can now use `npx reclaimspace -dc` as a shorthand for `--deep-clean`.
  - Added CLI parser test for multi-character short flags.

- **Enhanced End-to-End Tests** ([#56](https://github.com/gaureshpai/reclaimspace/issues/56)):
  - True E2E CLI binary tests spawning `bin/reclaimspace.js` as a child process with real filesystem fixtures, covering `--help`, `--version`, `--dry`, `--yes`, `--ignore`, clean workspace, `--deep-clean`, and invalid path scenarios.
  - Integration tests for `ui.start()` covering all orchestration branches: no targets, dry run, yes flag, partial deletion failures, EBUSY errors, interactive UI, user interrupt, and build analysis.
  - Unit tests for `src/deleter.js` verifying error-wrapping logic for success, EBUSY, EPERM, and generic errors.

- **Fixed Welcome Workflow for New Contributors** ([#58](https://github.com/gaureshpai/reclaimspace/issues/58)):
  - Removed broken `safe-to-test` label condition that prevented issue greetings on new issues.
  - Changed `pull_request_target` trigger from `labeled` to `opened`.
  - Added `coderabbitai[bot]` to bot exclusion list.

- **Consolidated CI Workflows** ([#59](https://github.com/gaureshpai/reclaimspace/issues/59)):
  - Merged `build.yml`, `lint.yml`, and `test.yml` into a single `ci.yml` workflow.
  - Reduces environment approval prompts from 3 per PR to 1.
  - Simplified `post-test-results.yml` to match the single-job CI setup.

> **Release: v0.2.3 - 2026-05-31**

## 2026-05-31

- **`--deep-clean` Flag** ([#51](https://github.com/gaureshpai/reclaimspace/pull/51)):
  - Added `--deep-clean` flag to clear package manager caches for npm, pnpm, yarn, and pip.
  - Detects available package managers and estimates cache sizes before cleaning.
  - Supports `--dry` mode for previewing cache cleanup without deleting.
  - Runs `npm cache clean --force`, `pnpm store prune`, `yarn cache clean`, and `pip cache purge` as appropriate.

- **Deep-Clean Unit Tests** ([#52](https://github.com/gaureshpai/reclaimspace/pull/52)):
  - Added comprehensive test coverage for the deep-cleaner module including package manager detection, cache size estimation, and clean execution.
  - Tests cover dry mode, real clean mode, error handling, and onMessage callbacks.

- **CI/CD Workflow Improvements** ([#47](https://github.com/gaureshpai/reclaimspace/pull/47)):
  - Switched publish workflow to OIDC-based authentication (`id-token: write`).
  - Removed duplicate CI runs on main branch pushes.
  - Gated PR workflows behind environment approval gates instead of `safe-to-test` labels.
  - Added dedicated Test workflow gated behind environment approval.
  - Updated pnpm version from 9 to 10 for build and lint workflows.
  - Simplified CI/CD feedback in pull request comments.

- **Stdin Protection During Deletion** ([#46](https://github.com/gaureshpai/reclaimspace/pull/46)):
  - Disabled keyboard input during file deletion to prevent accidental keystrokes from corrupting output.
  - Wrapped `stdin.pause()`/`resume()` in `try...finally` blocks for safety.

- **GitHub Stars Badge Fix** ([#44](https://github.com/gaureshpai/reclaimspace/pull/44)):
  - Added `.svg` extension to the GitHub stars badge URL for proper rendering.

- **Default Ignore Patterns Updated** ([#43](https://github.com/gaureshpai/reclaimspace/pull/43)):
  - Added `.vitest-attachments` and `.pnpm-store` to default ignore patterns.

- **Global Ignore Config** ([#40](https://github.com/gaureshpai/reclaimspace/pull/40)):
  - Refactored saving ignore patterns to a global configuration location (`%APPDATA%\reclaimspace\` on Windows, `~/Library/Application Support/reclaimspace/` on macOS, `~/.config/reclaimspace/` on Linux).
  - Platform-agnostic `getGlobalConfigDir` via dependency injection.
  - Deduplicated defaults in `readIgnoreFile` and added error handling for `saveIgnorePatterns`.

- **Issue Templates Cleaned Up**:
  - Removed redundant Issue Type and Priority dropdowns from issue templates.

- **Generated Unit Tests** ([#49](https://github.com/gaureshpai/reclaimspace/pull/49), [#50](https://github.com/gaureshpai/reclaimspace/pull/50)):
  - Added generated unit tests for various modules via CodeRabbit AI.

- **Documentation & README Updates**:
  - Formatted docs and updated README with latest features.
  - Updated docs/index.html and README.md.

> **Release: v0.2.2 - 2026-04-14**

## 2026-04-14

- **`--save-ignore` Flag for Permanent Exclusions** ([#30](https://github.com/gaureshpai/reclaimspace/pull/30)):
  - Added `--save` (`-s`) flag to persist ignore patterns to a global config file.
  - Combined with `--ignore`, saves patterns for permanent folder exclusions across all projects.

- **Additional Cache Folder Detection** ([#33](https://github.com/gaureshpai/reclaimspace/pull/33)):
  - Added `.wwebjs_cache`, `.wwebjs_auth`, `.eslintcache`, `.stylelintcache`, `.prettiercache`, `.tsbuildinfo`, `.swc`, and `.nx` to the build/cache detection categories.

- **Vite SSG Temp Folder** ([#28](https://github.com/gaureshpai/reclaimspace/pull/28)):
  - Added `.vite-ssg-temp` to build/cache categories.

- **Terminal Interruption Fix** ([#26](https://github.com/gaureshpai/reclaimspace/pull/26)):
  - Ensured "Thank you" message is displayed on terminal interruption (Ctrl+C).
  - Standardized exit messages and reinforced signal handling on all exit points.

- **CLI Flag Handling & Help Fallback** ([#25](https://github.com/gaureshpai/reclaimspace/pull/25)):
  - Improved CLI flag interpretation and help fallback behavior.
  - Added JSDoc comments to CLI parser and related modules.

- **Documentation Badge Cleanup** ([#27](https://github.com/gaureshpai/reclaimspace/pull/27)):
  - Removed redundant documentation site badge.

- **Performance: Optimized Directory Scanning**:
  - Optimized directory scanning and folder sizing with concurrency limits and regex caching.

- **Generated Unit Tests**:
  - Added generated unit tests via CodeRabbit AI for deep-cleaner and utility modules.

> **Release: v0.2.1 - 2026-03-16**

## 2026-03-16

- **`--help` and `--version` CLI Flags** ([#18](https://github.com/gaureshpai/reclaimspace/pull/18)):
  - Added standard `--help` (`-h`) and `--version` (`-v`) flags.
  - Implemented custom CLI argument parser with full option support, short flags, value options, and help/version display.

> **Release: v0.2.0 - 2026-03-10**

## 2026-03-10

- **Simplified CI/CD Pull Request Feedback** ([#16](https://github.com/gaureshpai/reclaimspace/pull/16)):
  - Simplified CI/CD feedback messages in pull request comments.
  - Updated `parse-logs.js` script and `post-test-results.yml` workflow.

- **Removed Deprecated Folder Categories** ([#15](https://github.com/gaureshpai/reclaimspace/pull/15)):
  - Removed `.vercel` and `.netlify` from folder categories.

> **Release: v0.1.7 - 2026-02-07**

## 2026-02-07

- **Issue Templates & Global Ignore Refinement** ([#11](https://github.com/gaureshpai/reclaimspace/pull/11)):
  - Configured GitHub issue templates for bugs and feature requests.
  - Refined global ignore list.
  - Updated prompt module.

> **Release: v0.1.7-0 - 2026-02-03**

## 2026-02-03 (v0.1.7-0)

- **Enhanced Issue Templates & Checkbox Prompt** ([`#8`](https://github.com/gaureshpai/reclaimspace/pull/8)):
  - Standardized issue templates with proper GitHub Forms schema.
  - Improved CLI checkbox prompt functionality.
  - Added issue template and prompt tests.

> **Release: v0.1.6 - 2026-02-03**

## 2026-02-03 (v0.1.6)

- **Expanded Detection & Documentation** ([#5](https://github.com/gaureshpai/reclaimspace/pull/5)):
  - Expanded folder detection capabilities with additional build/cache patterns.
  - Updated documentation site and README.
  - Improved UI/UX prompts.
  - Added contributor credits section.

> **Release: v0.1.5 - 2026-02-01**

## 2026-02-01

- **CLI Overhaul with Zero-Dependencies & pnpm Migration** ([#4](https://github.com/gaureshpai/reclaimspace/pull/4)):
  - Migrated from npm to pnpm as package manager.
  - Reduced to zero runtime dependencies by replacing `chalk`, `ora`, `cli-progress`, and `inquirer` with custom lightweight implementations (`src/lib/ansi.js`, `src/lib/spinner.js`, `src/lib/progress.js`, `src/lib/prompt.js`).
  - Complete CLI rewrite with custom argument parser (`src/lib/cli.js`).
  - Added Biome linter configuration and Husky pre-commit hooks.
  - Refactored `getFolderSize` with concurrency-limited recursive traversal.
  - Added comprehensive test suite for analyzer, CLI, fs-utils, match, scanner, and utils modules.

> **Release: v0.1.4 - 2025-11-18**

## 2025-11-18

- **Include Flag & Documentation Site** ([#2](https://github.com/gaureshpai/reclaimspace/pull/2)):
  - Added `--include` (`-c`) flag for specifying folders to include in the scan.
  - Created documentation site (`docs/index.html`, `docs/style.css`, `docs/script.js`).
  - Updated README with badges and contributor section.
  - Added site meta tags for SEO.

> **Release: v0.1.3 - 2025-09-13**

## 2025-09-13

- **Safety Enhancements & UX Improvements**:
  - Enhanced safety checks for file deletion.
  - Improved user experience with better error messages and ignore list handling.
  - Added `--build-analysis` flag for inferred project types and common build patterns.
  - Updated README with latest functionality.

> **Release: v0.1.2 - 2025-09-12**

## 2025-09-12

- **File Categorization & Error Handling**:
  - Reverted file categorization changes from v0.1.0.
  - Refined error handling for better robustness.
  - Updated test and CI configurations.
  - Created FUNDING.yml for sponsor links.

> **Release: v0.1.0 - 2025-09-11**

## 2025-09-11

- **Initial Project Release**:
  - Core CLI tool for reclaiming disk space by finding and removing regeneratable development folders.
  - Build pattern analysis for inferring project types.
  - Interactive UI for selecting folders to delete with arrow keys and space-to-select.
  - Concurrent scanner with progress bar for fast directory traversal.
  - Support for node_modules, build artifacts, test directories, and miscellaneous dev junk.
  - Integrated `minimatch` for glob pattern matching.
  - Added Code of Conduct (Contributor Covenant).
  - Comprehensive test suite.
  - Documentation and configuration files.
