import { getAboutPage, getProjects } from '$lib/utils/sanity';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const projects = await getProjects(hasRestricted);
	const about = await getAboutPage();

	if (projects && about) {
		return {
			projects,
			about,
			restrictedAccess: hasRestricted
		};
	}

	error(404, 'Not found');
};
