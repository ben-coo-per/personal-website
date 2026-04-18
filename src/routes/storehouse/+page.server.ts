import { getStorehouseProjects } from '$lib/utils/kirby';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const projects = await getStorehouseProjects();
	return { projects };
};
