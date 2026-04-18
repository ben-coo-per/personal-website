import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { kirbyFetch } from '$lib/utils/kirby';

export const GET: RequestHandler = async ({ params }) => {
	const { slug, file } = params;

	if (slug.includes('..') || file.includes('..')) error(400, 'Invalid path');

	const { data } = await kirbyFetch(`pages/projects+${slug}/files/${encodeURIComponent(file)}`);

	if (!data?.url) error(404, 'File not found');

	redirect(302, data.url);
};
