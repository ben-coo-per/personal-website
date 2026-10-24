import { Marked, type Tokens, type Token, type TokenizerAndRendererExtension } from 'marked';

/**
 * Markdown → article HTML for project (and blog) bodies.
 *
 * Plain markdown is the quick path to a page, so the renderer does the layout work
 * that the build-log kit (lib/log/log.css) expects, with no extra syntax:
 *
 * - a standalone image is emitted bare, not wrapped in <p>, so it runs full width
 * - two or more consecutive image lines (one per line, or one per paragraph) become a
 *   `.media-grid`, sized by count
 * - `![alt](clip.mp4)` renders a lazy <video>
 * - `![alt](photo.jpg "caption")` renders <figure> + <figcaption>
 * - `:::scroller … :::` renders a horizontally scrolling row
 * - relative src/poster/href values are resolved against an asset base, so media can
 *   be referenced by filename from the folder it sits in
 *
 * Raw HTML passes straight through (the content is our own).
 */

const VIDEO_RE = /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/i;

function esc(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function renderMedia(href: string, alt: string, title: string | null): string {
	const src = esc(href);
	const a = esc(alt);
	const media = VIDEO_RE.test(href)
		? `<video src="${src}" controls playsinline preload="none" aria-label="${a}"></video>`
		: `<img src="${src}" alt="${a}" loading="lazy" decoding="async">`;
	return title ? `<figure>${media}<figcaption>${esc(title)}</figcaption></figure>` : media;
}

/** Grid attributes by item count: pairs and triples get exact columns, crowds get a contact sheet. */
function gridOpen(n: number): string {
	if (n === 2 || n === 4) return '<div class="media-grid" data-cols="2">';
	if (n <= 6) return '<div class="media-grid" data-cols="3">';
	return '<div class="media-grid dense">';
}

function isBlankText(t: Token): boolean {
	return t.type === 'text' && !(t as Tokens.Text).text.trim();
}

/**
 * `:::scroller … :::` block — each non-blank line inside becomes its own item,
 * rendered as a separate `<p>` so the row has one flex child per image. (Letting
 * marked block-parse the body collapses consecutive image lines into a single
 * paragraph, which breaks the per-image nav in the `imageScrollers` action.)
 */
const scrollerExtension: TokenizerAndRendererExtension = {
	name: 'scroller',
	level: 'block',
	start(src: string) {
		const idx = src.indexOf('\n:::scroller');
		if (src.startsWith(':::scroller')) return 0;
		return idx === -1 ? undefined : idx + 1;
	},
	tokenizer(src: string) {
		const rule = /^:::scroller[ \t]*\n([\s\S]*?)\n:::[ \t]*(?:\n|$)/;
		const match = rule.exec(src);
		if (!match) return undefined;
		const inner = match[1];
		const items = inner
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => this.lexer.inline(line));
		return {
			type: 'scroller',
			raw: match[0],
			text: inner,
			tokens: [],
			items
		} as Tokens.Generic;
	},
	renderer(token) {
		const items = ((token as Tokens.Generic).items ?? []) as Token[][];
		const inner = items.map((tokens) => `<p>${this.parser.parseInline(tokens)}</p>`).join('');
		return `<div class="image-scroller">${inner}</div>\n`;
	}
};

/**
 * Two or more image-only lines in a row (blank lines between them allowed) become one
 * `.media-grid`. Interrupts a paragraph, so prose followed directly by a run of images
 * still groups them.
 */
const IMAGE_LINE = String.raw`[ \t]*!\[[^\]\n]*\]\([^)\n]*\)[ \t]*`;
const GRID_RULE = new RegExp(`^(?:${IMAGE_LINE}(?:\\n|$)(?:[ \\t]*\\n)*){2,}`);

const mediaGridExtension: TokenizerAndRendererExtension = {
	name: 'mediaGrid',
	level: 'block',
	start(src: string) {
		const m = /(?:^|\n)[ \t]*!\[/.exec(src);
		if (!m) return undefined;
		return m.index + (m[0].startsWith('\n') ? 1 : 0);
	},
	tokenizer(src: string) {
		const match = GRID_RULE.exec(src);
		if (!match) return undefined;
		const items = match[0]
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => this.lexer.inline(line));
		if (items.length < 2) return undefined;
		return {
			type: 'mediaGrid',
			raw: match[0],
			text: match[0],
			tokens: [],
			items
		} as Tokens.Generic;
	},
	renderer(token) {
		const items = ((token as Tokens.Generic).items ?? []) as Token[][];
		const inner = items.map((tokens) => this.parser.parseInline(tokens)).join('');
		return `${gridOpen(items.length)}${inner}</div>\n`;
	}
};

export const marked = new Marked({
	extensions: [scrollerExtension, mediaGridExtension],
	renderer: {
		image({ href, title, text }: Tokens.Image) {
			return renderMedia(href, text, title);
		},
		paragraph({ tokens }: Tokens.Paragraph) {
			// A paragraph that is only images (one, or several that the grid rule didn't
			// catch because prose interrupted the run) is media, not text: no <p>.
			const images = tokens.filter((t) => t.type === 'image');
			if (images.length && tokens.every((t) => t.type === 'image' || isBlankText(t))) {
				const inner = images.map((t) => this.parser.parseInline([t])).join('');
				return images.length > 1 ? `${gridOpen(images.length)}${inner}</div>\n` : `${inner}\n`;
			}
			return `<p>${this.parser.parseInline(tokens)}</p>\n`;
		}
	}
});

export interface RenderOptions {
	/** Base URL (no trailing slash) that relative src/poster/href values resolve against. */
	assetBase?: string;
}

/** Rewrites relative media references to absolute ones under `base`. */
export function resolveRelativeMedia(html: string, base: string): string {
	const root = base.replace(/\/+$/, '');
	return html.replace(
		/(\s(?:src|poster|href))="(?![a-z][a-z0-9+.-]*:|\/|#)([^"]*)"/gi,
		(_m, attr: string, path: string) => `${attr}="${root}/${path}"`
	);
}

export async function renderMarkdown(
	markdown: string,
	options: RenderOptions = {}
): Promise<string> {
	const html = await marked.parse(markdown);
	return options.assetBase ? resolveRelativeMedia(html, options.assetBase) : html;
}
