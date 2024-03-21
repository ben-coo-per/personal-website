import { getProjects } from '$lib/utils/sanity';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async () => {
	const projects = await getProjects();

	if (projects) {
		return {
			projects
		};
	}

	error(404, 'Not found');
}) satisfies PageLoad;
