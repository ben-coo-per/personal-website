import { render } from 'svelte/server';
import type { ProjectMetadata } from '$lib/types';
import { getProjectContent } from '$lib/utils/content';
import { renderMarkdown } from '$lib/utils/markdown';
import { projectAsset, projectAssetBase } from '$lib/utils/assets';
import { hasFreeformPage, loadFreeformPage } from '$lib/pages/projects';

/**
 * The body of a project as an HTML string, for consumers that can't mount a component:
 * the storehouse panel (`/api/project-content`) and the PDF export (`/api/export/project`).
 * A freeform page is server-rendered to static HTML (its interactivity degrades to the
 * markup); otherwise `content.md` is rendered. Callers handle the restricted gate.
 */
export async function getProjectHtml(project: ProjectMetadata): Promise<string> {
	if (hasFreeformPage(project.slug)) {
		const Page = await loadFreeformPage(project.slug);
		if (Page) {
			return render(Page, { props: { project, asset: projectAsset(project.slug) } }).body;
		}
	}
	const markdown = await getProjectContent(project.slug);
	return markdown ? renderMarkdown(markdown, { assetBase: projectAssetBase(project.slug) }) : '';
}
