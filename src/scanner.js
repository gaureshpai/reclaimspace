import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import fastFolderSize from 'fast-folder-size';
import chalk from 'chalk';
import { CATEGORIES, FOLDER_CATEGORIES, BUILD_ARTIFACT_PATTERNS } from './constants.js';
import * as minimatch from 'minimatch';

const fastFolderSizeAsync = promisify(fastFolderSize);

const CONCURRENCY_LIMIT = 5;

async function getBuildPatterns(folderPath) {
  const detectedPatterns = [];
  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    for (const pattern of BUILD_ARTIFACT_PATTERNS) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\./g, '\\.\\').replace(/\*/g, '.*'));
        if (entries.some(entry => regex.test(entry.name))) {
          detectedPatterns.push(pattern);
        }
      } else {
        if (entries.some(entry => entry.name === pattern)) {
          detectedPatterns.push(pattern);
        }
      }
    }
  } catch (err) {
    console.error(chalk.red(`Error checking build artifacts in ${folderPath}: ${err.message}`));
  }
  return detectedPatterns;
}

async function find(searchPaths, ignorePatterns, onProgress, spinner) {
  const startTime = process.hrtime.bigint();

  let targets = [];
  let totalSize = 0;
  const visited = new Set();

  const allPotentialDirs = [];

  async function collectDirs(currentPath) {
    if (visited.has(currentPath)) return;
    visited.add(currentPath);

    if (ignorePatterns.some(pattern => {
      try {
        const normalizedPath = currentPath.replace(/\\/g, '/');
        return minimatch.minimatch(normalizedPath, pattern, { matchBase: true });
      } catch (e) {
        return false;
      }
    })) {
      return;
    }

    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules') {
            allPotentialDirs.push({ path: fullPath, entry });
            continue;
          }
          allPotentialDirs.push({ path: fullPath, entry });
          await collectDirs(fullPath);
        }
      }
    } catch (err) {
      if (err.code !== 'EPERM') {
        console.error(chalk.red(`Error collecting directories in ${currentPath}: ${err.message}`));
      }
    }
  }

  for (const searchPath of searchPaths) {
    await collectDirs(searchPath);
  }

  spinner.stop();

  const queue = [...allPotentialDirs];
  const activePromises = new Set();

  visited.clear();

  onProgress.start(allPotentialDirs.length, 0);

  while (queue.length > 0 || activePromises.size > 0) {
    while (queue.length > 0 && activePromises.size < CONCURRENCY_LIMIT) {
      const dirInfo = queue.shift();
      const promise = processDir(dirInfo.path, dirInfo.entry).finally(() => {
        activePromises.delete(promise);
        onProgress.increment();
      });
      activePromises.add(promise);
    }
    if (activePromises.size > 0) {
      await Promise.race(activePromises);
    } else if (queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async function processDir(fullPath, entry) {
    spinner.text = chalk.bold.blue(`Scanning: ${fullPath}`);

    if (visited.has(fullPath)) {
      return;
    }
    visited.add(fullPath);

    if (ignorePatterns.some(pattern => {
      try {
        const normalizedPath = fullPath.replace(/\\/g, '/');
        return minimatch.minimatch(normalizedPath, pattern, { matchBase: true });
      } catch (e) {
        return false;
      }
    })) {
      return;
    }

    if (entry.isDirectory()) {
      let category = null;
      for (const cat of FOLDER_CATEGORIES) {
        if (cat.names.includes(entry.name)) {
          category = cat.id;
          break;
        }
      }

      if (category) {
        let detectedBuildPatterns = [];
        if (category === 'build') {
          detectedBuildPatterns = await getBuildPatterns(fullPath);
        }

        try {
          const size = await fastFolderSizeAsync(fullPath);
          if (size > 0) {
            const stats = await fs.stat(fullPath);
            targets.push({
              path: fullPath,
              size,
              category,
              name: entry.name,
              lastModified: stats.mtime,
              buildPatterns: detectedBuildPatterns,
            });
            totalSize += size;
          }
        } catch (err) {
          if (err.code !== 'EPERM') {
            console.error(chalk.red(`Error calculating size for ${fullPath}: ${err.message}`));
          }
        }
      }
    }
  }

  onProgress.stop();

  targets.sort((a, b) => {
    const orderA = CATEGORIES.find(c => c.id === a.category).order;
    const orderB = CATEGORIES.find(c => c.id === b.category).order;
    if (orderA !== orderB) return orderA - orderB;
    return b.size - a.size;
  });

  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1_000_000_000;

  return { targets, totalSize, duration };
}

export { find };
