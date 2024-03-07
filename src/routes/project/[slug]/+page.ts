import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getProject } from '$lib/utils/sanity';

export const ssr = false;

export const load = (async ({ params }) => {
	const post = await getProject(params.slug);
	if (post) return post;

	throw error(404, 'Not found');
}) satisfies PageLoad;
