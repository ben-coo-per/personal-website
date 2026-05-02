import { getAboutPage } from '$lib/utils/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const about = await getAboutPage();
	return { about };
};
