import { getProjects, getAiProfile } from '$lib/utils/content';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const [projects, aiProfile] = await Promise.all([getProjects(hasRestricted), getAiProfile()]);
	return { projects, aiProfile };
};
