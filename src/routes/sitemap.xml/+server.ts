import { getBlogPosts, getProjects, getStorehouseProjects } from '$lib/utils/content';
import { SITE_URL } from '$lib/seo';
import type { RequestHandler } from './$types';

// Static routes come from the filesystem at build time. Dynamic ([slug])
// routes are expanded from the content index per request, since the CMS
// changes without a deploy. `/` only redirects and `/export` is noindex.
const EXCLUDED = new Set(['/export']);

const STATIC_ROUTES = Object.keys(import.meta.glob('/src/routes/**/+page.{svelte,svx}'))
	.map((file) => file.replace(/^\/src\/routes/, '').replace(/\/\+page\.(svelte|svx)$/, '') || '/')
	.filter((route) => !route.includes('[') && !EXCLUDED.has(route))
	.sort();

type Entry = { path: string; lastmod?: Date };

const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

const toUrl = ({ path, lastmod }: Entry) =>
	`\t<url>\n\t\t<loc>${escapeXml(SITE_URL + path)}</loc>` +
	(lastmod ? `\n\t\t<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : '') +
	'\n\t</url>';

export const GET: RequestHandler = async () => {
	const [curated, storehouse, posts] = await Promise.all([
		getProjects(),
		getStorehouseProjects(),
		getBlogPosts()
	]);

	const entries: Entry[] = [
		...STATIC_ROUTES.map((path) => ({ path })),
		...[...curated, ...storehouse].map((p) => ({ path: `/projects/${p.slug}`, lastmod: p.date })),
		...posts.map((p) => ({ path: `/blog/${p.slug}`, lastmod: p.publishedAt }))
	];

	const body =
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
		entries.map(toUrl).join('\n') +
		'\n</urlset>\n';

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
