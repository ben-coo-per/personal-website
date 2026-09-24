import { getProjects } from '$lib/utils/content';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const projects = await getProjects(hasRestricted);
	return { projects };
};
