import { getProjects, getAboutPage, getHomePage } from '$lib/utils/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const [projects, allProjects, about, home] = await Promise.all([
		getProjects(hasRestricted),
		getProjects(true),
		getAboutPage(),
		getHomePage()
	]);

	const hasRestrictedProjects = allProjects.some((p) => p.isRestricted);

	return {
		projects,
		about,
		home,
		restrictedAccess: hasRestricted,
		hasRestrictedProjects
	};
};
