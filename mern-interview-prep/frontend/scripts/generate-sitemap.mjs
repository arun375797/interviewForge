import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

const fallbackSiteUrl = 'https://interviewforge.vercel.app';
const siteUrl = (process.env.VITE_SITE_URL || process.env.SITE_URL || fallbackSiteUrl)
  .trim()
  .replace(/\/+$/, '');

const routes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/subject/javascript', priority: '0.9', changefreq: 'weekly' },
  { path: '/subject/react', priority: '0.9', changefreq: 'weekly' },
  { path: '/subject/nodejs', priority: '0.9', changefreq: 'weekly' },
  { path: '/subject/dsa', priority: '0.9', changefreq: 'weekly' },
  { path: '/learn', priority: '0.8', changefreq: 'weekly' },
  { path: '/learn/javascript', priority: '0.8', changefreq: 'weekly' },
  { path: '/learn/react', priority: '0.8', changefreq: 'weekly' },
  { path: '/learn/nodejs', priority: '0.8', changefreq: 'weekly' },
  { path: '/learn/dsa', priority: '0.8', changefreq: 'weekly' },
  { path: '/code', priority: '0.8', changefreq: 'weekly' },
  { path: '/code/javascript', priority: '0.8', changefreq: 'weekly' },
  { path: '/code/dsa', priority: '0.8', changefreq: 'weekly' },
  { path: '/practice', priority: '0.7', changefreq: 'weekly' },
  { path: '/mock', priority: '0.7', changefreq: 'weekly' },
];

const lastmod = new Date().toISOString().slice(0, 10);

function xmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${xmlEscape(`${siteUrl}${route.path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /add
Disallow: /bookmarks
Disallow: /plan
Disallow: /login

Sitemap: ${siteUrl}/sitemap.xml
`;

await mkdir(publicDir, { recursive: true });
await Promise.all([
  writeFile(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8'),
  writeFile(path.join(publicDir, 'robots.txt'), robots, 'utf8'),
]);

console.log(`Generated sitemap and robots for ${siteUrl}`);
