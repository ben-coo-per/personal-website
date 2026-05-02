import { getBlogPost, getBlogPostContent } from '$lib/utils/content';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const blogPost = await getBlogPost(params.slug);

	if (!blogPost) {
		redirect(301, `/projects/${params.slug}`);
	}

	const content = await getBlogPostContent(params.slug);

	return {
		blogPost,
		content
	};
};
