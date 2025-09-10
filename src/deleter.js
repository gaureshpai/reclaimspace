import { rimraf } from 'rimraf';

async function deleteTarget(targetPath) {
  try {
    await rimraf(targetPath, { glob: false });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export { deleteTarget };