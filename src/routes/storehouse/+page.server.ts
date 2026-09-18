import { getStorehouseProjects } from '$lib/utils/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const projects = await getStorehouseProjects();
	const linkedSlug = url.searchParams.get('project');
	return { projects, linkedSlug };
};
