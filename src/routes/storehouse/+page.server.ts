import { getStorehouseProjects } from '$lib/utils/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const projects = await getStorehouseProjects();
	return { projects };
};
