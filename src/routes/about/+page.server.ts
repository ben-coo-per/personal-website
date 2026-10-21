import { getAboutPage, getStatuses } from '$lib/utils/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [about, statuses] = await Promise.all([getAboutPage(), getStatuses(30)]);
	return { about, statuses };
};
