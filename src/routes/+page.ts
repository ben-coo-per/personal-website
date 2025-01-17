import { getAboutPage, getProjects } from '$lib/utils/sanity';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async () => {
	const projects = await getProjects();
	const about = await getAboutPage();

	if (projects && about) {
		return {
			projects,
			about
		};
	}

	error(404, 'Not found');
}) satisfies PageLoad;
