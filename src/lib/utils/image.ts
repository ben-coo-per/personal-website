/**
 * Simple image URL builder for Kirby assets
 * Since we're using local files, we don't need complex transformations
 * Images are served from /cms-assets/{slug}/filename
 */

export interface ImageUrlBuilder {
	width: (w: number) => ImageUrlBuilder;
	height: (h: number) => ImageUrlBuilder;
	url: () => string;
}

export function urlFor(imagePath: string, slug?: string, type: 'projects' | 'blog' = 'projects'): ImageUrlBuilder {
	// If it's already a full path, return it
	const basePath = imagePath.startsWith('/') ? imagePath : `/cms-assets/${type}/${slug}/${imagePath}`;

	return {
		width: (w: number) => urlFor(imagePath, slug), // No-op for now, browser handles sizing
		height: (h: number) => urlFor(imagePath, slug), // No-op for now, browser handles sizing
		url: () => basePath
	};
}
