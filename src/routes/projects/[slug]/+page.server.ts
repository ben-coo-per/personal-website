import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getNextProjectInOrder, getProject, getProjectContent } from '$lib/utils/content';
import { renderMarkdown } from '$lib/utils/markdown';
import { projectAssetBase } from '$lib/utils/assets';
import { hasFreeformPage } from '$lib/pages/projects';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const hasRestricted = cookies.get('restrictedAccess') === 'true';
	const project = await getProject(params.slug);
	const next = await getNextProjectInOrder(params.slug, hasRestricted);

	if (!project) {
		error(404, 'Not found');
	}

	if (project.isRestricted && !hasRestricted) {
		return { needsPassword: true, project: null, next, format: 'markdown' as const, content: '' };
	}

	// A freeform Svelte page for this slug wins over content.md; +page.ts loads it.
	if (hasFreeformPage(project.slug)) {
		return { needsPassword: false, project, next, format: 'svelte' as const, content: '' };
	}

	const markdown = await getProjectContent(params.slug);
	const content = markdown
		? await renderMarkdown(markdown, { assetBase: projectAssetBase(project.slug) })
		: '';

	return { needsPassword: false, project, next, format: 'markdown' as const, content };
};
