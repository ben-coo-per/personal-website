import { error, json } from '@sveltejs/kit';
import { getProject, getProjectContent } from '$lib/utils/content';
import { marked } from '$lib/utils/markdown';
import type { RequestHandler } from './$types';

/**
 * Everything the client-side PDF exporter needs for one project: metadata plus
 * the rendered article HTML. Restricted projects require the same cookie the
 * project page checks, so the exporter can't leak gated content.
 */
export const GET: RequestHandler = async ({ params, cookies }) => {
	const project = await getProject(params.slug);
	if (!project) error(404, 'Not found');

	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	if (project.isRestricted && !hasRestricted) error(403, 'Restricted');

	const markdown = await getProjectContent(params.slug);
	const html = markdown ? await marked.parse(markdown) : '';

	return json({ project, html });
};
