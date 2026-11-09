import { error, redirect } from '@sveltejs/kit';
import { PUBLIC_R2_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

// 3D model files are streamed through this origin instead of redirected: the public R2
// bucket sends no CORS headers, and a WebGL loader fetches them with fetch(), which needs
// them. Images and video go to R2 directly as before.
const PROXIED = /\.(stl|glb|gltf|obj)$/i;
const TYPES: Record<string, string> = {
	stl: 'model/stl',
	glb: 'model/gltf-binary',
	gltf: 'model/gltf+json',
	obj: 'model/obj'
};

export const GET: RequestHandler = async ({ params, fetch }) => {
	const { slug, file } = params;

	if (slug.includes('..') || file.includes('..')) error(400, 'Invalid path');

	const url = `${PUBLIC_R2_URL}/projects/${slug}/${file}`;

	if (PROXIED.test(file)) {
		const upstream = await fetch(url);
		if (!upstream.ok) error(upstream.status === 404 ? 404 : 502, 'Model not available');
		const ext = file.split('.').pop()?.toLowerCase() ?? '';
		return new Response(upstream.body, {
			headers: {
				'content-type': TYPES[ext] ?? 'application/octet-stream',
				'cache-control': 'public, max-age=86400, s-maxage=604800'
			}
		});
	}

	redirect(302, url);
};
