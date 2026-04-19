import { getProjects, getAiProfile } from '$lib/utils/kirby';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const [projects, aiProfile] = await Promise.all([getProjects(hasRestricted), getAiProfile()]);
	return { projects, aiProfile };
};
