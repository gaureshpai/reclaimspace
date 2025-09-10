import fs from 'fs/promises';
import path from 'path';
import * as scanner from '../src/scanner.js';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Helper to create a directory and dummy files inside it to give it size
const createDummyDir = async (dirPath, size = 1024, files = ['dummy.txt']) => {
  await fs.mkdir(dirPath, { recursive: true });
  for (const file of files) {
    await fs.writeFile(path.join(dirPath, file), Buffer.alloc(size / files.length));
  }
};

// Setup and Teardown
beforeAll(async () => {
  await fs.mkdir(FIXTURES_DIR, { recursive: true });
  // Create a mock project structure
  await createDummyDir(path.join(FIXTURES_DIR, 'project1', 'node_modules'), 5000);
  await createDummyDir(path.join(FIXTURES_DIR, 'project1', 'dist'), 2000, ['index.js']);
  await createDummyDir(path.join(FIXTURES_DIR, 'project2', '.next'), 3000, ['index.js']);
  await createDummyDir(path.join(FIXTURES_DIR, 'project2', 'coverage'), 1000);
  await createDummyDir(path.join(FIXTURES_DIR, 'project3', 'ignored-folder'), 500);
});

afterAll(async () => {
  await fs.rm(FIXTURES_DIR, { recursive: true, force: true });
});

describe('scanner', () => {
  it('should find, categorize, and sort targets correctly', async () => {
    const mockOnProgress = {
      start: () => {},
      increment: () => {},
      stop: () => {},
    };
    const mockSpinner = {
      stop: () => {},
      text: ''
    };

    const { targets, totalSize } = await scanner.find([FIXTURES_DIR], ['ignored-folder'], mockOnProgress, mockSpinner);

    // 1. Check total size (approximate)
    expect(totalSize).toBeGreaterThanOrEqual(11000);

    // 2. Check if all targets were found (excluding ignored)
    expect(targets).toHaveLength(4);

    // 3. Check categorization and order
    // Order: node_modules -> build -> testing
    expect(targets[0].name).toBe('node_modules');
    expect(targets[0].category).toBe('node_modules');

    // The next two can be .next or dist, sorted by size
    const buildFolders = [targets[1].name, targets[2].name].sort();
    expect(buildFolders).toEqual(['.next', 'dist']);
    expect(targets[1].category).toBe('build');
    expect(targets[2].category).toBe('build');
    // Note: The order of build folders is not guaranteed if sizes are close, so we check size sorting logic if needed
    // For this test, we assume .next is larger than dist.
    expect(targets.find(t => t.name === '.next').size).toBeGreaterThan(targets.find(t => t.name === 'dist').size);


    expect(targets[3].name).toBe('coverage');
    expect(targets[3].category).toBe('testing');

    // 4. Check that the ignored folder is not present
    const ignored = targets.find(t => t.name === 'ignored-folder');
    expect(ignored).toBeUndefined();
  });
});