import { removePath } from "./lib/fs-utils.js";

async function deleteTarget(targetPath) {
  try {
    await removePath(targetPath);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export { deleteTarget };
