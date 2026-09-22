import { error } from '@sveltejs/kit';
import { PUBLIC_R2_URL } from '$env/static/public';
import { getProject } from '$lib/utils/content';
import type { RequestHandler } from './$types';

/**
 * Same-origin proxy for project images. The public R2 bucket doesn't send CORS
 * headers, so the browser can't read image bytes from it directly (and a
 * `<img>`-drawn canvas would be tainted). `/cms-assets/...` only redirects, which
 * doesn't help here. Streams the upstream body through untouched.
 */
export const GET: RequestHandler = async ({ params, cookies, setHeaders }) => {
	const { slug, file } = params;
	if (slug.includes('..') || file.includes('..')) error(400, 'Invalid path');

	const project = await getProject(slug);
	if (!project) error(404, 'Not found');
	if (project.isRestricted && cookies.get('restrictedAccess') !== 'true') error(403, 'Restricted');

	const upstream = await fetch(`${PUBLIC_R2_URL}/projects/${slug}/${file}`);
	if (!upstream.ok || !upstream.body)
		error(upstream.status === 404 ? 404 : 502, 'Asset unavailable');

	setHeaders({ 'cache-control': 'private, max-age=3600' });
	return new Response(upstream.body, {
		headers: {
			'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream'
		}
	});
};
