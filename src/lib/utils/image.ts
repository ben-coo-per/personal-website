import { PUBLIC_R2_URL } from '$env/static/public';

export interface ImageUrlBuilder {
	width: (w: number) => ImageUrlBuilder;
	height: (h: number) => ImageUrlBuilder;
	url: () => string;
}

export function urlFor(imagePath: string, slug?: string, type: 'projects' | 'blog' = 'projects'): ImageUrlBuilder {
	const url = imagePath.startsWith('/')
		? imagePath
		: `${PUBLIC_R2_URL}/${type}/${slug}/${imagePath}`;

	return {
		width: (_w: number) => urlFor(imagePath, slug, type),
		height: (_h: number) => urlFor(imagePath, slug, type),
		url: () => url
	};
}
