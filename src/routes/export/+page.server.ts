import { getAboutPage, getHomePage, getProjects, getStorehouseProjects } from '$lib/utils/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const [curated, storehouse, home, about] = await Promise.all([
		getProjects(hasRestricted),
		getStorehouseProjects(),
		getHomePage(),
		getAboutPage()
	]);

	return {
		curated,
		storehouse,
		tagline: home.taglines[0] ?? '',
		email: about.email,
		restrictedAccess: hasRestricted
	};
};
