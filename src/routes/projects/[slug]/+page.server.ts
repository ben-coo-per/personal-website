import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getNextProjectInOrder, getProject, getProjectContent } from '$lib/utils/content';
import { marked } from '$lib/utils/markdown';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const project = await getProject(params.slug);
	const next = await getNextProjectInOrder(params.slug, hasRestricted);

	if (!project) {
		error(404, 'Not found');
	}

	if (project.isRestricted && !hasRestricted) {
		return { needsPassword: true, project: null, next, content: '' };
	}

	const contentMarkdown = await getProjectContent(params.slug);
	const content = contentMarkdown ? await marked.parse(contentMarkdown) : '';

	return { project, next, content };
};
