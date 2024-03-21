import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getNextProjectInOrder, getProject } from '$lib/utils/sanity';

export const ssr = false;

export const load = (async ({ params }) => {
	const project = await getProject(params.slug);
	const next = await getNextProjectInOrder(params.slug);
	if (project) return { project, next };

	error(404, 'Not found');
}) satisfies PageLoad;
