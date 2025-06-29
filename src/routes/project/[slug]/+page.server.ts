import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getNextProjectInOrder, getProject } from '$lib/utils/sanity';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const project = await getProject(params.slug, hasRestricted);
	const next = await getNextProjectInOrder(params.slug);
	if (project) return { project, next };

	error(404, 'Not found');
};
