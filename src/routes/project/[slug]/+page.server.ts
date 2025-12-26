import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getNextProjectInOrder, getProject } from '$lib/utils/kirby';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const project = getProject(params.slug);
	const next = getNextProjectInOrder(params.slug, hasRestricted);

	if (!project) {
		error(404, 'Not found');
	}

	if (project.isRestricted && !hasRestricted) {
		return { needsPassword: true, project: null, next };
	}

	return { project, next };
};
