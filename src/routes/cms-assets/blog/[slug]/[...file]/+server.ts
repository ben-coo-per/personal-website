import { error, redirect } from '@sveltejs/kit';
import { PUBLIC_R2_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { slug, file } = params;

	if (slug.includes('..') || file.includes('..')) error(400, 'Invalid path');

	redirect(302, `${PUBLIC_R2_URL}/blog/${slug}/${file}`);
};
