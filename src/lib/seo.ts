import type { Page } from '@sveltejs/kit';
import type { BlogPostMetadata, ProjectMetadata } from '$lib/types';

export const SITE_URL = 'https://www.bencooper.xyz';
export const SITE_NAME = 'Ben Cooper';
export const AUTHOR = 'Ben Cooper';
export const OG_IMAGE = `${SITE_URL}/og-card.png`;

const DEFAULT_TITLE = 'Ben Cooper – Portfolio';
const DEFAULT_DESCRIPTION = 'Creative developer, designer, and more. Explore my projects and blog.';

export interface Seo {
	title: string;
	description: string;
	canonical: string;
	noindex?: boolean;
}

// The slice of page data the head cares about; every field is optional because
// each route only populates its own.
type SeoPageData = {
	project?: ProjectMetadata | null;
	blogPost?: BlogPostMetadata;
	projects?: ProjectMetadata[];
};

/**
 * One source of truth for <title>, description, canonical and Open Graph, so
 * the layout renders each exactly once. Per-page copy is the same text the
 * pages used to set in their own <svelte:head>.
 */
export function resolveSeo(page: Page): Seo {
	const data = page.data as SeoPageData;
	const canonical = `${SITE_URL}${page.url.pathname}`;
	const base = { canonical };

	switch (page.route.id) {
		case '/about':
			return {
				...base,
				title: 'About – Ben Cooper',
				description: 'About Ben Cooper — engineer, designer, developer.'
			};
		case '/blog':
			return {
				...base,
				title: 'Writing – Ben Cooper',
				description: 'Blog posts about projects, experiments, and learnings.'
			};
		case '/blog/[slug]':
			return {
				...base,
				title: `${data.blogPost?.title ?? 'Post'} – Ben Cooper`,
				description: data.blogPost?.excerpt || DEFAULT_DESCRIPTION
			};
		case '/projects/[slug]':
			return {
				...base,
				title: data.project?.title ? `${data.project.title} – Ben Cooper` : 'Project – Ben Cooper',
				description: data.project?.mainDescription || 'Project by Ben Cooper'
			};
		case '/storehouse': {
			// `?project=` is kept in sync by replaceState, so this tracks the open panel.
			const slug = page.url.searchParams.get('project');
			const selected = slug ? data.projects?.find((p) => p.slug === slug) : undefined;
			return {
				...base,
				title: `${selected ? `${selected.title} – Storehouse` : 'Storehouse'} – Ben Cooper`,
				description:
					selected?.subtitle ?? 'A dense archive of every project — big, small, and half-finished.'
			};
		}
		case '/export':
			return {
				...base,
				title: 'Export – Ben Cooper',
				description: 'Export project pages as a PDF portfolio.',
				noindex: true
			};
		case '/for-robots':
			return {
				...base,
				title: 'For robots – Ben Cooper',
				description: 'Instructions for AI assistants and crawlers reading bencooper.xyz.'
			};
		default:
			return { ...base, title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
	}
}

export const PERSON_JSON_LD = JSON.stringify({
	'@context': 'https://schema.org',
	'@type': 'Person',
	name: 'Ben Cooper',
	jobTitle: 'Product and design engineer',
	url: SITE_URL,
	email: 'me@bencooper.xyz',
	sameAs: ['https://www.linkedin.com/in/ben-coo-per/', 'https://www.instagram.com/ben.coo.per/']
});
