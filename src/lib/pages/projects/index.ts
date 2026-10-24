import type { Component } from 'svelte';
import type { ProjectMetadata } from '$lib/types';

/**
 * Freeform project pages: one Svelte component per project, named `<slug>.svelte` in
 * this folder. The project itself (title, date, flags, preview, media) still lives in
 * the content repo; this is only its body. When a page exists here it wins over the
 * project's `content.md`, on the live route and in the server-rendered HTML that the
 * storehouse panel and the PDF export consume.
 *
 * Pages receive the project's metadata and an `asset(file)` helper that resolves a
 * filename from the project's folder to its public URL. Build them from lib/log.
 */
export interface FreeformPageProps {
	project: ProjectMetadata;
	asset: (file: string) => string;
}

export type FreeformPage = Component<FreeformPageProps>;

const modules = import.meta.glob<{ default: FreeformPage }>('./*.svelte');

const bySlug = new Map(
	Object.entries(modules).map(([path, loader]) => [
		path.replace(/^\.\//, '').replace(/\.svelte$/, ''),
		loader
	])
);

export function hasFreeformPage(slug: string): boolean {
	return bySlug.has(slug);
}

export async function loadFreeformPage(slug: string): Promise<FreeformPage | null> {
	const loader = bySlug.get(slug);
	if (!loader) return null;
	return (await loader()).default;
}

export function freeformSlugs(): string[] {
	return [...bySlug.keys()];
}
