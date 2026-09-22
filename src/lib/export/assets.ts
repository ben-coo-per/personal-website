import type { FontSet, PreparedImage, Quality } from './types';

/** Longest edge in pixels + JPEG quality. 'print' is ~270 dpi across an A4 text block. */
const QUALITY: Record<Quality, { maxEdge: number; jpeg: number }> = {
	screen: { maxEdge: 1100, jpeg: 0.8 },
	print: { maxEdge: 1800, jpeg: 0.9 }
};

const FONT_FILES: Record<keyof FontSet, string> = {
	display: '/fonts/PPMondwest-Regular.otf',
	sans: '/fonts/pdf/Rubik-Regular.ttf',
	sansMedium: '/fonts/pdf/Rubik-Medium.ttf',
	sansItalic: '/fonts/pdf/Rubik-Italic.ttf',
	mono: '/fonts/pdf/JetBrainsMono-Regular.ttf'
};

let fontsPromise: Promise<FontSet> | null = null;

export function loadFonts(): Promise<FontSet> {
	fontsPromise ??= (async () => {
		const entries = await Promise.all(
			(Object.entries(FONT_FILES) as [keyof FontSet, string][]).map(async ([key, url]) => {
				const res = await fetch(url);
				if (!res.ok) throw new Error(`Font ${url} → ${res.status}`);
				return [key, new Uint8Array(await res.arrayBuffer())] as const;
			})
		);
		return Object.fromEntries(entries) as unknown as FontSet;
	})();
	return fontsPromise;
}

const imageCache = new Map<string, Promise<PreparedImage | null>>();

/**
 * Fetches, decodes, downsizes, and re-encodes an article image so pdfkit can
 * embed it (it only reads JPEG and PNG; the CMS also serves webp and gif).
 *
 * Everything becomes JPEG, with transparent pixels flattened onto the page
 * colour first. Canvas can only emit RGBA PNGs, and pdfkit embeds those by
 * inflating and splitting the alpha channel in pure JS — several seconds per
 * large image — whereas JPEG bytes are passed straight through.
 *
 * Results are cached per source URL + background so re-exporting doesn't
 * re-download.
 */
export function prepareImage(
	src: string,
	background: string,
	quality: Quality
): Promise<PreparedImage | null> {
	const key = `${quality} ${background} ${src}`;
	let pending = imageCache.get(key);
	if (!pending) {
		pending = prepareUncached(src, background, quality).catch((err) => {
			console.warn('[export] image skipped:', src, err);
			return null;
		});
		imageCache.set(key, pending);
	}
	return pending;
}

async function prepareUncached(
	src: string,
	background: string,
	quality: Quality
): Promise<PreparedImage | null> {
	const { maxEdge, jpeg } = QUALITY[quality];
	const url = resolveAssetUrl(src);
	if (!url) return null;

	const res = await fetch(url);
	if (!res.ok) throw new Error(`${res.status}`);
	const blob = await res.blob();

	const bitmap = await decode(blob);
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('no 2d context');
	ctx.fillStyle = background;
	ctx.fillRect(0, 0, width, height);
	ctx.drawImage(bitmap, 0, 0, width, height);
	if ('close' in bitmap) bitmap.close();

	const encoded = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, 'image/jpeg', jpeg)
	);
	if (!encoded) throw new Error('encode failed');

	return { data: await encoded.arrayBuffer(), width, height };
}

async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
	try {
		return await createImageBitmap(blob);
	} catch {
		// Older Safari can't createImageBitmap from every format — fall back to <img>.
		const url = URL.createObjectURL(blob);
		try {
			const img = new Image();
			img.src = url;
			await img.decode();
			return img;
		} finally {
			URL.revokeObjectURL(url);
		}
	}
}

/**
 * Maps a content image URL onto the same-origin proxy. Site-relative
 * `/cms-assets/projects/<slug>/<file>` links and absolute R2 links both
 * resolve; anything else is fetched as-is and may fail on CORS.
 */
export function resolveAssetUrl(src: string): string | null {
	if (!src) return null;
	const rel = src.match(/^\/cms-assets\/projects\/([^/]+)\/(.+)$/);
	if (rel) return `/api/export/asset/${rel[1]}/${rel[2]}`;
	const r2 = src.match(/^https?:\/\/[^/]+\/projects\/([^/]+)\/(.+)$/);
	if (r2) return `/api/export/asset/${r2[1]}/${r2[2]}`;
	if (/^https?:\/\//.test(src) || src.startsWith('/')) return src;
	return null;
}
