import { copyFile, writeFile } from 'node:fs/promises';
// GitHub Pages serves this document on a direct visit to a client-side route.
// BrowserRouter renders the current path. The initial HTTP status remains 404.
await copyFile('dist/index.html', 'dist/404.html');
await writeFile('dist/.nojekyll', '');
