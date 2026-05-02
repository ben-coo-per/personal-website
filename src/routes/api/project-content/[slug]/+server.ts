import { json } from '@sveltejs/kit';
import { getProjectContent } from '$lib/utils/content';
import { marked } from 'marked';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const markdown = await getProjectContent(params.slug);
	const html = markdown ? await marked(markdown) : '';
	return json({ html });
};
