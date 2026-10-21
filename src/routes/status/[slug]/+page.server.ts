import { getStatus } from '$lib/utils/content';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const post = await getStatus(params.slug);
	if (!post) error(404, 'Status not found');
	return { post };
};
