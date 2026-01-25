import { getBlogPost, getBlogPostContent } from '$lib/utils/kirby';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const blogPost = getBlogPost(params.slug);

	if (!blogPost) {
		error(404, 'Blog post not found');
	}

	const content = getBlogPostContent(params.slug);

	return {
		blogPost,
		content
	};
};
