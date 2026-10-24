import { PUBLIC_R2_URL } from '$env/static/public';

/** Public URL of the folder that holds a project's media in R2. */
export function projectAssetBase(slug: string): string {
	return `${PUBLIC_R2_URL}/projects/${slug}`;
}

/** `asset('photo.jpg')` → absolute URL of that file in the project's folder. */
export function projectAsset(slug: string): (file: string) => string {
	const base = projectAssetBase(slug);
	return (file: string) => `${base}/${file.replace(/^\/+/, '')}`;
}
