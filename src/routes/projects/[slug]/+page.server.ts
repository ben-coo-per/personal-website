import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getNextProjectInOrder, getProject, getProjectContent } from '$lib/utils/kirby';
import { marked } from 'marked';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const project = getProject(params.slug);
	const next = getNextProjectInOrder(params.slug, hasRestricted);

	if (!project) {
		error(404, 'Not found');
	}

	if (project.isRestricted && !hasRestricted) {
		return { needsPassword: true, project: null, next, content: '' };
	}

	const contentMarkdown = getProjectContent(params.slug);
	const content = contentMarkdown ? await marked(contentMarkdown) : '';

	return { project, next, content };
};
