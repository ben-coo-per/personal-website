import { getBlogPosts } from '$lib/utils/kirby';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const blogPosts = await getBlogPosts();

	return {
		blogPosts
	};
};
