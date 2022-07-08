import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toAbsolute = p => path.resolve(__dirname, p);

const template = fs.readFileSync(toAbsolute('dist/index.html'), 'utf-8');
const { render } = await import('./dist/server/entry-server.cjs');

(async () => {
  // pre-render each route...
  for (const url of ['/']) {
    const result = await render(url);
    const html = template.replace(
      `<div id="app"></div>`,
      `<div id="main">${result.body}</div>`
    );

    const filePath = `dist${
      url === '/' ? '/index' : url === '/blog' ? '/blog/index' : url
    }.html`;
    fs.writeFileSync(toAbsolute(filePath), html);
    console.log('pre-rendered:', filePath);
  }
})();
