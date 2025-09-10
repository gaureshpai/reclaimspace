import fs from 'fs/promises';
import path from 'path';

function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function readIgnoreFile(baseDir) {
  const ignoreFilePath = path.join(baseDir, '.reclaimspacerc');
  try {
    const content = await fs.readFile(ignoreFilePath, 'utf-8');
    return content.split(/\r?\n/).filter(line => line && !line.startsWith('#'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `0${d.getMonth() + 1}`.slice(-2);
  const day = `0${d.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
}

export {
  formatSize,
  readIgnoreFile,
  formatDate
};