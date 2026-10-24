import { error, json } from '@sveltejs/kit';
import { getProject } from '$lib/utils/content';
import { getProjectHtml } from '$lib/server/projectHtml';
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

	return json({ project, html: await getProjectHtml(project) });
};
