import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toAbsolute = p => path.resolve(__dirname, p);

const template = fs.readFileSync(toAbsolute('dist/index.html'), 'utf-8');
const { render } = await import('./dist/server/entry-server.cjs');
try {
  fs.mkdirSync(toAbsolute('dist/docs'));
} catch (e) {}

(async () => {
  // pre-render each route...
  for (const url of ['/', '/docs/getting-started']) {
    const result = await render(url);
    let html = template.replace(
      `<div id="app"></div>`,
      `<div id="app">${result.body}</div>`
    );
    html = html.replace(
      `<!-- Styles -->`,
      `<style id="_goober">${result.css}</style>`
    );

    const filePath = `dist${
      url === '/' ? '/index' : url === '/docs' ? '/docs/index' : url
    }.html`;
    fs.writeFileSync(toAbsolute(filePath), html);
    console.log('pre-rendered:', filePath);
  }
})();
