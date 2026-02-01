import { removePath } from "./lib/fs-utils.js";

/**
 * Deletes a target path recursively.
 * @param {string} targetPath - The absolute path to delete.
 * @returns {Promise<{success: boolean, error?: Error}>} Result object indicating success or failure.
 */
async function deleteTarget(targetPath) {
  try {
    await removePath(targetPath);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export { deleteTarget };
