import { error, json } from '@sveltejs/kit';
import { getProject } from '$lib/utils/content';
import { getProjectHtml } from '$lib/server/projectHtml';
import type { RequestHandler } from './$types';

/**
 * The rendered body of a project, for the storehouse panel. Freeform pages arrive
 * server-rendered; markdown pages are rendered. Restricted projects need the same
 * cookie the project page checks.
 */
export const GET: RequestHandler = async ({ params, cookies }) => {
	const project = await getProject(params.slug);
	if (!project) error(404, 'Not found');

	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	if (project.isRestricted && !hasRestricted) error(403, 'Restricted');

	return json({ html: await getProjectHtml(project) });
};
