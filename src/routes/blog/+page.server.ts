import { getBlogPosts } from '$lib/utils/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const blogPosts = await getBlogPosts();

	return {
		blogPosts
	};
};
