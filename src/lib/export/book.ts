import PDFDocument from 'pdfkit';
import type { ProjectMetadata } from '$lib/types';
import { PALETTES, type Palette } from './palette';
import type {
	Block,
	BookOptions,
	ImageRef,
	PageSize,
	PreparedImage,
	ProjectDoc,
	RenderInput,
	Run
} from './types';

/*
 * Portfolio-book renderer. Draws straight into pdfkit — real text, embedded
 * fonts, clickable links, a PDF outline — rather than rasterising the web page.
 *
 * Page anatomy (portrait):
 *   cover → contents → per project: opener (eyebrow / title / subtitle /
 *   description / links, hero grounded at the foot of the page) → body pages.
 *   Body copy sits in a narrower measure on the left; images span the full
 *   text block. Every page carries a running footer with the project name and
 *   page number.
 */

const PAGE: Record<PageSize, [number, number]> = {
	A4: [595.28, 841.89],
	LETTER: [612, 792]
};

const MARGIN = { top: 64, bottom: 72, left: 58, right: 58 };

/** Body measure — roughly 66 characters of Rubik at 10.5pt. */
const TEXT_MEASURE = 368;

const BODY = { size: 10.5, leading: 16.5 };
const IMAGE_RADIUS = 4;
const CAPTION_H = 17;
const CONTENTS_ROW_H = 36;

/** The 8×8 diamond-ring brand glyph on a 14-unit tile (mirrors DitherBackground / cursor). */
const GLYPH: [number, number, number, number][] = [
	[6, 4, 2, 1],
	[5, 5, 4, 1],
	[4, 6, 2, 2],
	[8, 6, 2, 2],
	[5, 8, 4, 1],
	[6, 9, 2, 1]
];

type FontName = 'display' | 'sans' | 'sansMedium' | 'sansItalic' | 'mono';

interface TextStyle {
	x: number;
	width: number;
	size: number;
	leading: number;
	color: string;
	font?: FontName;
	align?: 'left' | 'right' | 'center';
}

export function renderDocument(input: RenderInput): Promise<Uint8Array> {
	return new Renderer(input).render();
}

class Renderer {
	private doc: PDFKit.PDFDocument;
	private pal: Palette;
	private W: number;
	private H: number;
	private top = MARGIN.top;
	private bottom: number;
	private left = MARGIN.left;
	private right: number;
	private contentW: number;
	private textW: number;
	private pageContentH: number;

	/** Running-footer label per page index (null → no footer). */
	private labels: (string | null)[] = [];
	private currentLabel: string | null = null;
	private chunks: Uint8Array[] = [];

	constructor(private input: RenderInput) {
		const { options, fonts } = input;
		this.pal = PALETTES[options.theme];
		[this.W, this.H] = PAGE[options.size];
		this.bottom = this.H - MARGIN.bottom;
		this.right = this.W - MARGIN.right;
		this.contentW = this.right - this.left;
		this.textW = Math.min(TEXT_MEASURE, this.contentW);
		this.pageContentH = this.bottom - this.top;

		const titles = input.projects.map((p) => p.meta.title ?? p.meta.slug);
		const docTitle =
			input.projects.length === 1 && !options.frontMatter
				? `${titles[0]} — ${options.author}`
				: `${options.author} — Selected Work`;

		this.doc = new PDFDocument({
			size: [this.W, this.H],
			margins: MARGIN,
			bufferPages: true,
			autoFirstPage: false,
			// The browser build has no standard fonts; everything is registered below.
			font: null as unknown as undefined,
			compress: true,
			displayTitle: true,
			lang: 'en',
			info: {
				Title: docTitle,
				Author: options.author,
				Creator: options.site,
				Subject: 'Portfolio'
			}
		});

		(Object.keys(fonts) as FontName[]).forEach((name) => this.doc.registerFont(name, fonts[name]));

		this.doc.on('data', (chunk: Uint8Array) => this.chunks.push(chunk));
		this.doc.on('pageAdded', () => {
			this.labels.push(this.currentLabel);
			this.paintPage();
		});
	}

	async render(): Promise<Uint8Array> {
		const { projects, options } = this.input;

		let contentsStart = -1;
		if (options.frontMatter) {
			this.cover();
			contentsStart = this.reserveContents(projects.length);
		}

		const starts = projects.map((p, i) => this.project(p, i, projects.length));

		if (options.frontMatter) this.fillContents(contentsStart, starts);
		this.footers();

		return this.finish();
	}

	// ───────────────────────── page plumbing ─────────────────────────

	private get pageIndex(): number {
		return this.labels.length - 1;
	}

	private newPage(label: string | null = this.currentLabel) {
		this.currentLabel = label;
		this.doc.addPage();
	}

	/**
	 * Fills the page background. pdfkit re-applies its remembered fill colour
	 * after a mid-paragraph page break, so that memory has to be put back or the
	 * rest of the paragraph would be painted in the page colour.
	 */
	private paintPage() {
		const doc = this.doc as PDFKit.PDFDocument & { _fillColor?: [string, number] };
		const previous = doc._fillColor;
		doc.save();
		doc.rect(0, 0, this.W, this.H).fill(this.pal.bg);
		doc.restore();
		if (previous) doc.fillColor(previous[0], previous[1]);
	}

	/** Runs `draw` with automatic page breaks disabled — for chrome placed near the page edge. */
	private withoutPageBreaks(draw: () => void) {
		const saved = this.doc.page.margins.bottom;
		this.doc.page.margins.bottom = 0;
		draw();
		this.doc.page.margins.bottom = saved;
	}

	private ensureSpace(height: number) {
		if (this.doc.y + height > this.bottom) this.newPage();
	}

	/** Space left on the page once `gap` of leading whitespace has been applied. */
	private remainingAfter(gap: number): number {
		return this.bottom - this.doc.y - (this.doc.y > this.top + 0.5 ? gap : 0);
	}

	/**
	 * Whether an image block can be scaled into the space left rather than
	 * pushed to a new page — packs pages tighter without shrinking things to
	 * thumbnails.
	 */
	private shrinksAcceptably(natural: number, remaining: number): boolean {
		return remaining >= 160 && remaining >= natural * 0.62;
	}

	/** Vertical whitespace that is dropped when it would land at the top of a page. */
	private space(amount: number) {
		if (this.doc.y > this.top + 0.5) this.doc.y += amount;
	}

	private finish(): Promise<Uint8Array> {
		const { doc } = this;
		return new Promise((resolve, reject) => {
			doc.on('end', () => {
				const total = this.chunks.reduce((n, c) => n + c.length, 0);
				const out = new Uint8Array(total);
				let offset = 0;
				for (const c of this.chunks) {
					out.set(c, offset);
					offset += c.length;
				}
				resolve(out);
			});
			doc.on('error', reject);
			doc.end();
		});
	}

	// ───────────────────────── typography ─────────────────────────

	/** Sets font + size and returns the lineGap that produces the requested leading. */
	private type(font: FontName, size: number, leading = size * 1.3): number {
		this.doc.font(font).fontSize(size);
		return leading - this.doc.currentLineHeight(false);
	}

	private eyebrow(
		text: string,
		x: number,
		y: number,
		opts: { width?: number; align?: 'left' | 'right'; color?: string } = {}
	) {
		const { doc } = this;
		this.type('mono', 7);
		// Eyebrows are positioned chrome, sometimes at the page foot — never let them paginate.
		this.withoutPageBreaks(() => {
			doc.fillColor(opts.color ?? this.pal.ink3).text(text.toUpperCase(), x, y, {
				width: opts.width ?? this.contentW,
				align: opts.align ?? 'left',
				characterSpacing: 0.9,
				lineBreak: false
			});
		});
	}

	private hairline(y: number, x = this.left, width = this.contentW, color = this.pal.rule) {
		this.doc.rect(x, y, width, 0.5).fill(color);
	}

	private accentDash(x: number, y: number, width = 22, height = 1.5) {
		this.doc.rect(x, y, width, height).fill(this.pal.accent);
	}

	/**
	 * Lays out styled runs as one wrapped paragraph using pdfkit's `continued`
	 * chaining. Every run passes its own link/underline explicitly, because
	 * pdfkit carries unspecified options over from the previous continued call.
	 */
	private richText(runs: Run[], style: TextStyle) {
		const { doc, pal } = this;
		const base = style.font ?? 'sans';
		doc.x = style.x;
		runs.forEach((run, i) => {
			const font: FontName = run.code
				? 'mono'
				: run.bold
					? 'sansMedium'
					: run.italic && base === 'sans'
						? 'sansItalic'
						: base;
			const color = run.link ? pal.link : run.code ? pal.code : run.bold ? pal.ink : style.color;
			const gap = this.type(font, run.code ? style.size * 0.92 : style.size, style.leading);
			doc.fillColor(color).text(run.text, {
				width: style.width,
				align: style.align ?? 'left',
				lineGap: gap,
				continued: i < runs.length - 1,
				link: run.link ?? null,
				underline: false
			});
		});
	}

	private plainText(text: string, style: TextStyle) {
		this.richText([{ text }], style);
	}

	private truncate(text: string, width: number): string {
		const { doc } = this;
		if (doc.widthOfString(text) <= width) return text;
		const words = text.split(' ');
		while (words.length > 1 && doc.widthOfString(words.join(' ') + '…') > width) words.pop();
		return words.join(' ') + '…';
	}

	// ───────────────────────── front matter ─────────────────────────

	private cover() {
		const { doc, pal } = this;
		const { projects, options } = this.input;
		this.newPage(null);

		const years = projects.map((p) => p.meta.date.getFullYear());
		const range = `${Math.min(...years)} — ${Math.max(...years)}`;

		this.eyebrow('Portfolio  ·  selected work', this.left, this.top);
		this.eyebrow(range, this.left, this.top, { align: 'right' });
		this.hairline(this.top + 16);

		let y = this.H * 0.34;
		let gap = this.type('display', 68, 64);
		doc
			.fillColor(pal.title)
			.text(options.author, this.left, y, { width: this.contentW, lineGap: gap });
		y = doc.y + 6;

		gap = this.type('sans', 15, 21);
		doc
			.fillColor(pal.ink2)
			.text(options.tagline, this.left, y, { width: this.contentW, lineGap: gap });
		y = doc.y + 18;

		this.accentDash(this.left, y);
		y += 18;

		this.type('mono', 8);
		doc
			.fillColor(pal.ink3)
			.text(`${String(projects.length).padStart(2, '0')} projects   ·   ${range}`, this.left, y, {
				width: this.contentW,
				characterSpacing: 0.3
			});

		this.ditherField(this.left, this.H * 0.6, this.right, this.H - 108);

		const footY = this.H - 60;
		this.hairline(footY - 14);
		this.eyebrow(options.site, this.left, footY);
		this.eyebrow(options.email, this.left, footY, { align: 'right' });
	}

	/**
	 * Sparse field of the brand glyph, thresholded on distance from the
	 * bottom-right corner so it thins out toward the type — a real dither
	 * rather than a fade.
	 */
	private ditherField(x0: number, y0: number, x1: number, y1: number) {
		const { doc, pal } = this;
		const step = 8;
		const s = step / 14;
		const cols = Math.floor((x1 - x0) / step);
		const rows = Math.floor((y1 - y0) / step);
		const fx = x1;
		const fy = y1;
		const reach = Math.hypot(x1 - x0, y1 - y0) * 0.92;

		doc.save();
		doc.fillColor(pal.accent).fillOpacity(0.7);
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const cx = x0 + c * step;
				const cy = y0 + r * step;
				const d = Math.hypot(fx - (cx + step / 2), fy - (cy + step / 2)) / reach;
				const density = Math.pow(Math.max(0, 1 - d), 1.5);
				if (hash(c, r) >= density) continue;
				for (const [gx, gy, gw, gh] of GLYPH) {
					doc.rect(cx + gx * s, cy + gy * s, gw * s, gh * s);
				}
			}
		}
		doc.fill();
		doc.restore();
	}

	private contentsRowsPerPage(): number {
		return Math.floor((this.pageContentH - 56) / CONTENTS_ROW_H);
	}

	private reserveContents(count: number): number {
		const pages = Math.max(1, Math.ceil(count / this.contentsRowsPerPage()));
		const start = this.labels.length;
		for (let i = 0; i < pages; i++) this.newPage('contents');
		return start;
	}

	private fillContents(startPage: number, projectStarts: number[]) {
		const { doc, pal } = this;
		const { projects } = this.input;
		const perPage = this.contentsRowsPerPage();

		projects.forEach((p, i) => {
			const pageOffset = Math.floor(i / perPage);
			const row = i % perPage;
			if (row === 0) {
				doc.switchToPage(startPage + pageOffset);
				this.eyebrow(pageOffset === 0 ? 'Contents' : 'Contents, continued', this.left, this.top);
				this.hairline(this.top + 16);
			}

			const y = this.top + 40 + row * CONTENTS_ROW_H;
			const title = p.meta.title ?? p.meta.slug;
			const numW = 26;
			const pageNoW = 34;
			const yearW = 40;
			const textX = this.left + numW;
			const textW = this.contentW - numW - pageNoW - yearW - 16;

			this.type('mono', 7.5);
			doc.fillColor(pal.ink3).text(String(i + 1).padStart(2, '0'), this.left, y + 3, {
				width: numW,
				lineBreak: false
			});

			this.type('sansMedium', 10.5);
			doc.fillColor(pal.ink).text(this.truncate(title, textW), textX, y + 1, {
				width: textW,
				lineBreak: false
			});

			if (p.meta.subtitle) {
				this.type('sans', 8);
				doc.fillColor(pal.ink3).text(this.truncate(p.meta.subtitle, textW), textX, y + 15, {
					width: textW,
					lineBreak: false
				});
			}

			this.type('mono', 7.5);
			doc
				.fillColor(pal.ink3)
				.text(String(p.meta.date.getFullYear()), this.right - pageNoW - yearW, y + 3, {
					width: yearW,
					align: 'right',
					lineBreak: false
				});
			doc.fillColor(pal.ink2).text(String(projectStarts[i] + 1), this.right - pageNoW, y + 3, {
				width: pageNoW,
				align: 'right',
				lineBreak: false
			});

			this.hairline(y + CONTENTS_ROW_H - 6);
			doc.goTo(this.left, y - 4, this.contentW, CONTENTS_ROW_H, `p-${p.meta.slug}`);
		});
	}

	// ───────────────────────── projects ─────────────────────────

	/** Renders one project; returns the page index its opener landed on. */
	private project(project: ProjectDoc, index: number, count: number): number {
		const { doc, pal } = this;
		const { meta } = project;
		const title = meta.title ?? meta.slug;
		let blocks = project.blocks;

		this.newPage(title);
		const startPage = this.pageIndex;
		doc.addNamedDestination(`p-${meta.slug}`);
		doc.outline.addItem(title);

		const flags = [meta.wip ? 'work in progress' : null, meta.archived ? 'archive' : null]
			.filter(Boolean)
			.join('  ·  ');
		this.eyebrow(
			`${String(index + 1).padStart(2, '0')}  /  ${String(count).padStart(2, '0')}`,
			this.left,
			this.top
		);
		this.eyebrow(
			[String(meta.date.getFullYear()), flags].filter(Boolean).join('  ·  '),
			this.left,
			this.top,
			{
				align: 'right'
			}
		);
		this.hairline(this.top + 16);

		// Title — shrink long ones so they hold to one or two lines.
		let titleSize = 42;
		this.type('display', titleSize);
		const titleWidth = doc.widthOfString(title);
		if (titleWidth > this.contentW * 1.6)
			titleSize = Math.max(26, (titleSize * this.contentW * 1.6) / titleWidth);
		const titleGap = this.type('display', titleSize, titleSize * 0.98);
		doc
			.fillColor(pal.title)
			.text(title, this.left, this.top + 54, { width: this.contentW, lineGap: titleGap });
		doc.y += 6;

		if (meta.subtitle) {
			this.plainText(meta.subtitle, {
				x: this.left,
				width: Math.min(this.contentW, 420),
				size: 14,
				leading: 19,
				color: pal.ink2
			});
		}

		doc.y += 16;
		this.accentDash(this.left, doc.y);
		doc.y += 18;

		const paragraphs = (meta.mainDescription ?? '')
			.split(/\n{2,}/)
			.map((s) => s.replace(/\s+/g, ' ').trim())
			.filter(Boolean);
		paragraphs.forEach((text) => {
			this.plainText(text, {
				x: this.left,
				width: this.textW,
				size: BODY.size,
				leading: BODY.leading,
				color: pal.ink2
			});
			doc.y += 6;
		});

		this.links(meta);

		// Hero: the first block if it's an image, grounded at the foot of the opener.
		const first = blocks[0];
		const hero = first?.type === 'image' ? this.input.images.get(first.image.src) : null;
		let heroPlaced = false;
		if (first?.type === 'image' && hero) {
			const remaining = this.bottom - doc.y - 26;
			if (remaining >= 190) {
				const caption = this.captionFor(first.image.alt);
				const capH = caption ? CAPTION_H : 0;
				const { w, h } = fit(hero, this.contentW, remaining - capH);
				const y = this.bottom - h - capH;
				this.drawImage(hero, this.left, y, w, h);
				if (caption) this.caption(caption, this.left, y + h + 6, w);
				heroPlaced = true;
				blocks = blocks.slice(1);
			}
		}

		if (blocks.length) {
			if (heroPlaced) this.newPage();
			else {
				doc.y += 18;
				this.hairline(doc.y);
				doc.y += 22;
			}
			blocks.forEach((b) => this.block(b));
		}

		return startPage;
	}

	private links(meta: ProjectMetadata) {
		const { doc, pal } = this;
		const items = [
			meta.websiteUrl ? { label: 'website', url: meta.websiteUrl } : null,
			meta.githubLink ? { label: 'github', url: meta.githubLink } : null,
			meta.onshapeLink ? { label: 'onshape', url: meta.onshapeLink } : null,
			meta.instagramLink ? { label: 'instagram', url: meta.instagramLink } : null
		].filter((i): i is { label: string; url: string } => !!i);
		if (!items.length) return;

		doc.y += 6;
		let x = this.left;
		const y = doc.y;
		items.forEach((item) => {
			this.type('mono', 7);
			const label = item.label.toUpperCase();
			doc.fillColor(pal.ink3).text(label, x, y, { characterSpacing: 0.9, lineBreak: false });
			x += doc.widthOfString(label, { characterSpacing: 0.9 }) + 8;

			this.type('mono', 7.5);
			const shown = item.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
			doc.fillColor(pal.link).text(shown, x, y, { link: item.url, lineBreak: false });
			x += doc.widthOfString(shown) + 22;
		});
		doc.y = y + 16;
	}

	// ───────────────────────── blocks ─────────────────────────

	private block(b: Block) {
		switch (b.type) {
			case 'heading':
				return this.heading(b.level, b.runs);
			case 'paragraph':
				return this.paragraph(b.runs);
			case 'image':
				return this.image(b.image);
			case 'gallery':
				return this.gallery(b.images);
			case 'list':
				return this.list(b.ordered, b.items);
			case 'quote':
				return this.quote(b.runs);
			case 'code':
				return this.code(b.text);
			case 'rule':
				return this.rule();
		}
	}

	private heading(level: 2 | 3, runs: Run[]) {
		const { doc, pal } = this;
		const size = level === 2 ? 15.5 : 11.5;
		const leading = size * 1.25;
		const before = level === 2 ? 16 : 10;
		// Keep with next: the heading plus a few lines of what follows.
		this.ensureSpace(before + leading + 12 + BODY.leading * 3);
		this.space(before);
		if (level === 2) {
			this.accentDash(this.left, doc.y, 18);
			doc.y += 11;
		}
		this.richText(runs, {
			x: this.left,
			width: this.textW,
			size,
			leading,
			color: pal.ink,
			font: 'sansMedium'
		});
		doc.y += level === 2 ? 5 : 3;
	}

	private paragraph(runs: Run[]) {
		this.ensureSpace(BODY.leading * 2);
		this.richText(runs, {
			x: this.left,
			width: this.textW,
			size: BODY.size,
			leading: BODY.leading,
			color: this.pal.ink2
		});
		this.doc.y += 7;
	}

	private list(ordered: boolean, items: Run[][]) {
		const { doc, pal } = this;
		const indent = 16;
		items.forEach((runs, i) => {
			this.ensureSpace(BODY.leading * 2);
			const y = doc.y;
			this.type(ordered ? 'mono' : 'sans', ordered ? 8 : BODY.size);
			doc
				.fillColor(pal.ink3)
				.text(ordered ? `${i + 1}.` : '–', this.left, y + (ordered ? 1.5 : 0), {
					lineBreak: false
				});
			doc.y = y;
			this.richText(runs, {
				x: this.left + indent,
				width: this.textW - indent,
				size: BODY.size,
				leading: BODY.leading,
				color: pal.ink2
			});
			doc.y += 3;
		});
		doc.y += 6;
	}

	private quote(runs: Run[]) {
		const { doc, pal } = this;
		const size = 11.5;
		const leading = 18;
		const inset = 18;
		const gap = this.type('sansItalic', size, leading);
		const height = doc.heightOfString(runs.map((r) => r.text).join(''), {
			width: this.textW - inset,
			lineGap: gap
		});
		this.ensureSpace(Math.min(height, this.pageContentH * 0.5) + 16);
		this.space(6);
		const y0 = doc.y;
		const page0 = this.pageIndex;
		this.richText(runs, {
			x: this.left + inset,
			width: this.textW - inset,
			size,
			leading,
			color: pal.ink2,
			font: 'sansItalic'
		});
		if (this.pageIndex === page0) {
			doc.rect(this.left, y0 + 3, 1.5, doc.y - y0 - 8).fill(pal.accent);
		}
		doc.y += 10;
	}

	private code(text: string) {
		const { doc, pal } = this;
		const size = 8.5;
		const leading = 13;
		const pad = 12;
		const gap = this.type('mono', size, leading);
		const innerW = this.contentW - pad * 2;
		const height = doc.heightOfString(text, { width: innerW, lineGap: gap });
		const boxed = height + pad * 2 <= this.pageContentH;

		if (boxed) {
			this.ensureSpace(height + pad * 2 + 8);
			this.space(6);
			const y = doc.y;
			doc.roundedRect(this.left, y, this.contentW, height + pad * 2, IMAGE_RADIUS).fill(pal.codeBg);
			doc.fillColor(pal.ink2).text(text, this.left + pad, y + pad, { width: innerW, lineGap: gap });
			doc.y = y + height + pad * 2 + 12;
		} else {
			doc.fillColor(pal.ink2).text(text, this.left, doc.y, { width: this.contentW, lineGap: gap });
			doc.y += 12;
		}
	}

	private rule() {
		this.ensureSpace(30);
		this.space(8);
		this.hairline(this.doc.y, this.left, this.textW);
		this.doc.y += 18;
	}

	// ───────────────────────── images ─────────────────────────

	private image(ref: ImageRef) {
		const img = this.input.images.get(ref.src);
		if (!img) return;
		const caption = this.captionFor(ref.alt);
		const capH = caption ? CAPTION_H : 0;
		const before = 8;

		// Tall images are capped short of the full page so a paragraph can follow them.
		const maxH = Math.min(this.pageContentH - capH, this.pageContentH * 0.72);
		let { w, h } = fit(img, this.contentW, maxH);
		const remaining = this.remainingAfter(before) - capH;
		if (h > remaining && this.shrinksAcceptably(h, remaining)) {
			({ w, h } = fit(img, this.contentW, remaining));
			this.space(before);
		} else if (h > remaining) {
			this.newPage();
		} else {
			this.space(before);
		}

		const y = this.doc.y;
		this.drawImage(img, this.left, y, w, h);
		if (caption) this.caption(caption, this.left, y + h + 6, w);
		this.doc.y = y + h + capH + 18;
	}

	/** Rows of two or three images sharing one height, so a set never strands a single image. */
	private gallery(refs: ImageRef[]) {
		const items = refs
			.map((ref) => ({ ref, img: this.input.images.get(ref.src) }))
			.filter((i): i is { ref: ImageRef; img: PreparedImage } => !!i.img);
		if (!items.length) return;
		if (items.length === 1) return this.image(items[0].ref);

		const gap = 10;
		const maxRowH = this.pageContentH * 0.42;

		for (const row of galleryRows(items)) {
			const ratios = row.map(({ img }) => img.width / img.height);
			let h = Math.min(
				(this.contentW - gap * (row.length - 1)) / ratios.reduce((a, b) => a + b, 0),
				maxRowH
			);
			const captions = row.map(({ ref }) => this.captionFor(ref.alt));
			const capH = captions.some(Boolean) ? CAPTION_H : 0;

			const remaining = this.remainingAfter(8) - capH;
			if (h > remaining && this.shrinksAcceptably(h, remaining)) {
				h = remaining;
				this.space(8);
			} else if (h > remaining) {
				this.newPage();
			} else {
				this.space(8);
			}
			const widths = ratios.map((r) => h * r);

			const y = this.doc.y;
			let x = this.left;
			row.forEach(({ img }, j) => {
				this.drawImage(img, x, y, widths[j], h);
				if (captions[j]) this.caption(captions[j] as string, x, y + h + 6, widths[j]);
				x += widths[j] + gap;
			});
			this.doc.y = y + h + capH + gap;
		}
		this.doc.y += 8;
	}

	private drawImage(img: PreparedImage, x: number, y: number, w: number, h: number) {
		const { doc } = this;
		doc.save();
		doc.roundedRect(x, y, w, h, IMAGE_RADIUS).clip();
		doc.image(img.data, x, y, { width: w, height: h });
		doc.restore();
		doc.roundedRect(x, y, w, h, IMAGE_RADIUS).lineWidth(0.6).stroke(this.pal.imgBorder);
	}

	private caption(text: string, x: number, y: number, width: number) {
		this.type('mono', 7);
		this.withoutPageBreaks(() => {
			this.doc
				.fillColor(this.pal.ink3)
				.text(this.truncate(text, width), x, y, { width, lineBreak: false });
		});
	}

	/** Alt text doubles as a caption when it reads like one, not like a filename. */
	private captionFor(alt: string): string | null {
		const text = alt.trim();
		if (text.length < 20) return null;
		if (/^(hero|gallery|image|img|photo|picture|screenshot|untitled)\b/i.test(text)) return null;
		return text;
	}

	// ───────────────────────── footers ─────────────────────────

	private footers() {
		const { doc, pal } = this;
		const range = doc.bufferedPageRange();
		for (let i = range.start; i < range.start + range.count; i++) {
			const label = this.labels[i];
			if (label === null) continue;
			doc.switchToPage(i);
			this.withoutPageBreaks(() => {
				const y = this.H - 42;
				this.type('mono', 7);
				doc.fillColor(pal.ink3).text(String(i + 1), this.left, y, {
					width: this.contentW,
					align: 'right',
					lineBreak: false
				});
				if (label !== 'contents') {
					this.eyebrow(`${this.input.options.author}  ·  ${label}`, this.left, y, {
						width: this.contentW - 40
					});
				}
			});
		}
	}
}

/** Splits n ≥ 2 items into rows of 2, using rows of 3 to absorb an odd remainder (5 → 2 + 3). */
function galleryRows<T>(items: T[]): T[][] {
	const rows: T[][] = [];
	let remaining = items.length;
	let i = 0;
	while (remaining > 0) {
		const take = remaining === 3 || (remaining % 2 === 1 && remaining <= 5) ? 3 : 2;
		rows.push(items.slice(i, i + take));
		i += take;
		remaining -= take;
	}
	return rows;
}

/** Scales an image to sit within a box, never upscaling past the box width. */
function fit(img: PreparedImage, maxW: number, maxH: number): { w: number; h: number } {
	let w = maxW;
	let h = (w * img.height) / img.width;
	if (h > maxH) {
		h = maxH;
		w = (h * img.width) / img.height;
	}
	return { w, h };
}

/** Deterministic 0–1 noise so the cover dither is identical on every export. */
function hash(x: number, y: number): number {
	const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
	return v - Math.floor(v);
}
