import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getAboutPage } from '$lib/utils/sanity';

export const load = (async () => {
	const about = await getAboutPage();
	if (about) {
		return { about };
	}
	throw error(404, 'Not found');
}) satisfies PageLoad;
