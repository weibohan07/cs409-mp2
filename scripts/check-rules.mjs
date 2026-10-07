import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}
const files = ['index.html', ...(await walk('src'))];
const violations = [];
for (const file of files.filter(file => /\.(tsx|html|svg)$/.test(file))) {
  const source = await readFile(file, 'utf8');
  if (/\bstyle\s*=/.test(source)) violations.push(`${file}: inline style attribute`);
  if (/<table\b/i.test(source)) violations.push(`${file}: HTML table (use CSS Grid for layout)`);
  if (/<script\b(?![^>]*\bsrc\s*=)[^>]*>/i.test(source)) violations.push(`${file}: inline script`);
}
if (violations.length) { console.error(violations.join('\n')); process.exit(1); }
console.log('Course source-rule checks passed: no inline styles, inline scripts, or layout tables.');
