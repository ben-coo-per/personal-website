import { getProjects, getAboutPage } from '$lib/utils/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const [projects, allProjects, about] = await Promise.all([
		getProjects(hasRestricted),
		getProjects(true),
		getAboutPage()
	]);

	const hasRestrictedProjects = allProjects.some((p) => p.isRestricted);

	return {
		projects,
		about,
		restrictedAccess: hasRestricted,
		hasRestrictedProjects
	};
};
