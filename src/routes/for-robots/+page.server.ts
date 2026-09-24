import { getAiProfile } from '$lib/utils/content';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const text = await getAiProfile();
	return { text };
};
