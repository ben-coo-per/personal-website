import { getAiProfile } from '$lib/utils/kirby';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const profile = await getAiProfile();
	const body = profile || '# bencooper.xyz\n\nNo AI profile configured.';
	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
