import fs from 'node:fs';
import path from 'node:path';

const pathsToDelete = [
  path.resolve(process.cwd(), '.vercel/output/static/index.html'),
  path.resolve(process.cwd(), '.output/public/index.html')
];

console.log('[Clean Build] Starting post-build cleanup...');

for (const p of pathsToDelete) {
  if (fs.existsSync(p)) {
    console.log(`[Clean Build] Deleting static HTML file to prevent SSR override: ${p}`);
    try {
      fs.unlinkSync(p);
      console.log(`[Clean Build] Successfully deleted: ${p}`);
    } catch (e) {
      console.error(`[Clean Build] Failed to delete ${p}:`, e);
    }
  } else {
    console.log(`[Clean Build] File not found (skipping): ${p}`);
  }
}

console.log('[Clean Build] Cleanup complete.');
