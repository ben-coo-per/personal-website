import { getBlogPost, getBlogPostContent } from '$lib/utils/kirby';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const blogPost = await getBlogPost(params.slug);

	if (!blogPost) {
		error(404, 'Blog post not found');
	}

	const content = await getBlogPostContent(params.slug);

	return {
		blogPost,
		content
	};
};
