import type { ProjectMetadata } from '$lib/types';

/** One styled span of inline text. */
export interface Run {
	text: string;
	bold?: boolean;
	italic?: boolean;
	code?: boolean;
	link?: string;
}

export interface ImageRef {
	src: string;
	alt: string;
}

/** Block-level article content, distilled from the rendered project HTML. */
export type Block =
	| { type: 'heading'; level: 2 | 3; runs: Run[] }
	| { type: 'paragraph'; runs: Run[] }
	| { type: 'image'; image: ImageRef }
	| { type: 'gallery'; images: ImageRef[] }
	| { type: 'list'; ordered: boolean; items: Run[][] }
	| { type: 'quote'; runs: Run[] }
	| { type: 'code'; text: string }
	| { type: 'rule' };

/** Encoded image bytes (JPEG or PNG) plus pixel dimensions, ready for pdfkit. */
export interface PreparedImage {
	data: ArrayBuffer;
	width: number;
	height: number;
}

export interface FontSet {
	display: Uint8Array;
	sans: Uint8Array;
	sansMedium: Uint8Array;
	sansItalic: Uint8Array;
	mono: Uint8Array;
}

export type PageSize = 'A4' | 'LETTER';
export type Theme = 'paper' | 'ink';
/** Image resolution: 'screen' keeps the file emailable, 'print' embeds ~270 dpi images. */
export type Quality = 'screen' | 'print';

export interface BookOptions {
	size: PageSize;
	theme: Theme;
	quality: Quality;
	/** Cover + contents pages. Off for single-project exports. */
	frontMatter: boolean;
	author: string;
	site: string;
	email: string;
	tagline: string;
}

export interface ProjectDoc {
	meta: ProjectMetadata;
	blocks: Block[];
}

export interface RenderInput {
	projects: ProjectDoc[];
	images: Map<string, PreparedImage | null>;
	fonts: FontSet;
	options: BookOptions;
}

export type ExportMode = 'book' | 'zip' | 'single';

export interface ExportProgress {
	phase: 'fonts' | 'content' | 'images' | 'render' | 'done';
	/** 0–1 */
	fraction: number;
	detail: string;
}
