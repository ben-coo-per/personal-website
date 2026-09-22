import type { ProjectMetadata } from '$lib/types';
import { loadFonts, prepareImage } from './assets';
import { PALETTES } from './palette';
import { collectImageRefs, parseProjectHtml } from './parse';
import type {
	BookOptions,
	ExportMode,
	ExportProgress,
	PreparedImage,
	ProjectDoc,
	Quality
} from './types';

export type { BookOptions, ExportMode, ExportProgress, PageSize, Quality, Theme } from './types';

export interface ExportResult {
	blob: Blob;
	filename: string;
}

const IMAGE_CONCURRENCY = 4;

/**
 * Drives a full export: fetches each project's rendered HTML, distils it to
 * blocks, prepares every image, then renders one book, one PDF per project
 * zipped together, or a single project — all in the browser.
 */
export async function exportProjects(
	projects: ProjectMetadata[],
	mode: ExportMode,
	options: Omit<BookOptions, 'frontMatter'>,
	onProgress: (p: ExportProgress) => void = () => {}
): Promise<ExportResult> {
	onProgress({ phase: 'fonts', fraction: 0, detail: 'loading typefaces' });
	const fonts = await loadFonts();

	const docs: ProjectDoc[] = [];
	for (const [i, meta] of projects.entries()) {
		onProgress({
			phase: 'content',
			fraction: 0.05 + (0.1 * i) / projects.length,
			detail: `reading ${meta.slug}`
		});
		docs.push(await fetchProjectDoc(meta));
	}

	const refs = new Map<string, string>();
	docs.forEach((d) => collectImageRefs(d.blocks).forEach((r) => refs.set(r.src, r.alt)));
	const images = await prepareAll(
		[...refs.keys()],
		PALETTES[options.theme].bg,
		options.quality,
		(done, total, src) =>
			onProgress({
				phase: 'images',
				fraction: 0.15 + (0.65 * done) / Math.max(1, total),
				detail: `preparing image ${done}/${total} — ${src.split('/').pop() ?? ''}`
			})
	);

	const { renderDocument } = await import('./book');
	const author = slugify(options.author);

	if (mode === 'zip') {
		const { zipSync } = await import('fflate');
		const files: Record<string, Uint8Array> = {};
		for (const [i, doc] of docs.entries()) {
			onProgress({
				phase: 'render',
				fraction: 0.8 + (0.2 * i) / docs.length,
				detail: `rendering ${doc.meta.slug}.pdf`
			});
			await nextFrame();
			const pdf = await renderDocument({
				projects: [doc],
				images,
				fonts,
				options: { ...options, frontMatter: false }
			});
			files[`${String(i + 1).padStart(2, '0')}-${doc.meta.slug}.pdf`] = pdf;
		}
		// PDFs are already deflated; store them rather than recompress.
		const zip = zipSync(files, { level: 0 });
		onProgress({ phase: 'done', fraction: 1, detail: 'done' });
		return {
			blob: new Blob([zip], { type: 'application/zip' }),
			filename: `${author}-projects.zip`
		};
	}

	onProgress({ phase: 'render', fraction: 0.82, detail: 'laying out pages' });
	await nextFrame();
	const single = mode === 'single' && docs.length === 1;
	const pdf = await renderDocument({
		projects: docs,
		images,
		fonts,
		options: { ...options, frontMatter: !single }
	});
	onProgress({ phase: 'done', fraction: 1, detail: 'done' });
	return {
		blob: new Blob([pdf], { type: 'application/pdf' }),
		filename: single ? `${author}-${docs[0].meta.slug}.pdf` : `${author}-selected-work.pdf`
	};
}

async function fetchProjectDoc(meta: ProjectMetadata): Promise<ProjectDoc> {
	const res = await fetch(`/api/export/project/${meta.slug}`);
	if (!res.ok) throw new Error(`Couldn't load ${meta.slug} (${res.status})`);
	const { project, html } = (await res.json()) as { project: ProjectMetadata; html: string };
	return {
		meta: { ...project, date: new Date(project.date) },
		blocks: parseProjectHtml(html)
	};
}

async function prepareAll(
	srcs: string[],
	background: string,
	quality: Quality,
	onEach: (done: number, total: number, src: string) => void
): Promise<Map<string, PreparedImage | null>> {
	const out = new Map<string, PreparedImage | null>();
	let next = 0;
	let done = 0;
	const worker = async () => {
		while (next < srcs.length) {
			const src = srcs[next++];
			out.set(src, await prepareImage(src, background, quality));
			done++;
			onEach(done, srcs.length, src);
		}
	};
	await Promise.all(Array.from({ length: Math.min(IMAGE_CONCURRENCY, srcs.length) }, worker));
	return out;
}

export function downloadBlob({ blob, filename }: ExportResult) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * Lets the progress UI paint before a long synchronous render. A timeout
 * rather than requestAnimationFrame: rAF never fires in a background tab, which
 * would stall the export until the tab is focused again.
 */
function nextFrame(): Promise<void> {
	return new Promise((r) => setTimeout(r, 30));
}
