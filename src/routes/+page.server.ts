import { getProjects, getAboutPage } from '$lib/utils/kirby';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const projects = getProjects(hasRestricted);
	const about = getAboutPage();

	return {
		projects,
		about,
		restrictedAccess: hasRestricted
	};
};
