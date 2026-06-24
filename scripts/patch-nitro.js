import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const targetFile = path.join(rootDir, 'node_modules', 'nitro', 'dist', 'vite.mjs');

console.log(`[Patch Nitro] Target file: ${targetFile}`);

if (!fs.existsSync(targetFile)) {
  console.error('[Patch Nitro] Target file not found. Skipping patch.');
  process.exit(0);
}

try {
  let content = fs.readFileSync(targetFile, 'utf8');
  
  // Find the problematic line: ctx._isRolldown = !!this.meta.rolldownVersion;
  // and replace it with a safe check that works when `this` is undefined (Vite 6).
  const targetPattern = 'ctx._isRolldown = !!this.meta.rolldownVersion;';
  const replacement = 'ctx._isRolldown = !!(this && this.meta && this.meta.rolldownVersion);';
  
  if (content.includes(targetPattern)) {
    content = content.replace(targetPattern, replacement);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[Patch Nitro] Successfully patched nitro/dist/vite.mjs for Vite 6 compatibility.');
  } else if (content.includes(replacement)) {
    console.log('[Patch Nitro] File is already patched.');
  } else {
    console.warn('[Patch Nitro] Target pattern not found in nitro/dist/vite.mjs. It might have been modified or updated.');
  }
} catch (error) {
  console.error('[Patch Nitro] Failed to patch nitro/dist/vite.mjs:', error);
  process.exit(1);
}
