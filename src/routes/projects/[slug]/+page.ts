import type { PageLoad } from './$types';
import { loadFreeformPage } from '$lib/pages/projects';

/**
 * Universal load so a freeform page's component is imported on whichever side renders:
 * the server on first load (so the page is in the HTML), the client on navigation.
 * Universal load data isn't serialised, so handing a component through is fine.
 */
export const load: PageLoad = async ({ data }) => {
	const Page =
		data.format === 'svelte' && data.project ? await loadFreeformPage(data.project.slug) : null;
	return { ...data, Page };
};
