import type { Block, ImageRef, Run } from './types';

/**
 * Turns the rendered project HTML (the same `marked` output the site displays)
 * into a flat list of blocks the PDF renderer can lay out. Walking the DOM
 * rather than re-parsing markdown keeps the export in lock-step with the site —
 * the `:::scroller` extension, for instance, arrives as `.image-scroller`.
 */
export function parseProjectHtml(html: string): Block[] {
	const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
	const blocks: Block[] = [];
	for (const el of Array.from(doc.body.children)) {
		blocks.push(...blockFromElement(el));
	}
	return mergeAdjacentImages(blocks);
}

/**
 * Back-to-back standalone images (separate markdown paragraphs) read as a set,
 * so they're grouped into a gallery and laid out side by side rather than each
 * taking most of a page.
 */
function mergeAdjacentImages(blocks: Block[]): Block[] {
	const out: Block[] = [];
	for (const block of blocks) {
		const prev = out[out.length - 1];
		if (block.type === 'image' && prev?.type === 'image') {
			out[out.length - 1] = { type: 'gallery', images: [prev.image, block.image] };
		} else if (block.type === 'image' && prev?.type === 'gallery') {
			prev.images.push(block.image);
		} else {
			out.push(block);
		}
	}
	return out;
}

interface RunStyle {
	bold?: boolean;
	italic?: boolean;
	code?: boolean;
	link?: string;
}

function blockFromElement(el: Element): Block[] {
	const tag = el.tagName.toLowerCase();

	switch (tag) {
		case 'h1':
		case 'h2':
			return [{ type: 'heading', level: 2, runs: inlineRuns(el) }];
		case 'h3':
		case 'h4':
		case 'h5':
		case 'h6':
			return [{ type: 'heading', level: 3, runs: inlineRuns(el) }];
		case 'ul':
		case 'ol':
			return [{ type: 'list', ordered: tag === 'ol', items: listItems(el) }];
		case 'blockquote': {
			const runs = inlineRuns(el, {}, '\n');
			return runs.length ? [{ type: 'quote', runs }] : [];
		}
		case 'pre':
			return [{ type: 'code', text: (el.textContent ?? '').replace(/\s+$/, '') }];
		case 'hr':
			return [{ type: 'rule' }];
		case 'img':
			return [{ type: 'image', image: imageRef(el as HTMLImageElement) }];
		case 'div':
			if (el.classList.contains('image-scroller')) {
				return [galleryOrImage(images(el))];
			}
			return Array.from(el.children).flatMap(blockFromElement);
		default:
			return paragraphBlocks(el);
	}
}

/**
 * A `<p>` may hold prose, one image, or (from consecutive markdown image lines)
 * several images with only whitespace between them. Prose stays a paragraph;
 * images are lifted out into their own blocks so the layout can size them.
 */
function paragraphBlocks(el: Element): Block[] {
	const imgs = images(el);
	const runs = inlineRuns(el);
	const out: Block[] = [];
	if (runs.length) out.push({ type: 'paragraph', runs });
	if (imgs.length) out.push(galleryOrImage(imgs));
	return out;
}

function galleryOrImage(imgs: ImageRef[]): Block {
	return imgs.length === 1 ? { type: 'image', image: imgs[0] } : { type: 'gallery', images: imgs };
}

function images(el: Element): ImageRef[] {
	return Array.from(el.querySelectorAll('img')).map(imageRef);
}

function imageRef(img: HTMLImageElement): ImageRef {
	return { src: img.getAttribute('src') ?? '', alt: (img.getAttribute('alt') ?? '').trim() };
}

function listItems(list: Element): Run[][] {
	const items: Run[][] = [];
	for (const li of Array.from(list.children)) {
		if (li.tagName.toLowerCase() !== 'li') continue;
		// Nested lists are flattened; their items follow the parent item.
		const nested = Array.from(li.children).filter((c) => /^(ul|ol)$/i.test(c.tagName));
		nested.forEach((n) => n.remove());
		const runs = inlineRuns(li);
		if (runs.length) items.push(runs);
		nested.forEach((n) => items.push(...listItems(n)));
	}
	return items;
}

/**
 * Flattens an element's inline content into styled runs. Whitespace is
 * collapsed the way a browser would render it; `<br>` (and `paragraphJoin`
 * between block children, used for blockquotes) become explicit newlines.
 */
function inlineRuns(root: Element, style: RunStyle = {}, paragraphJoin = ' '): Run[] {
	const raw: Run[] = [];

	const walk = (node: Node, current: RunStyle) => {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = (node.textContent ?? '').replace(/\s+/g, ' ');
			if (text) raw.push({ text, ...current });
			return;
		}
		if (node.nodeType !== Node.ELEMENT_NODE) return;
		const el = node as Element;
		const tag = el.tagName.toLowerCase();

		if (tag === 'img' || tag === 'script' || tag === 'style') return;
		if (tag === 'br') {
			raw.push({ text: '\n' });
			return;
		}

		const next: RunStyle = { ...current };
		if (tag === 'strong' || tag === 'b') next.bold = true;
		if (tag === 'em' || tag === 'i') next.italic = true;
		if (tag === 'code') next.code = true;
		if (tag === 'a') {
			const href = el.getAttribute('href');
			if (href && /^https?:/i.test(href)) next.link = href;
		}

		const isBlockChild = tag === 'p' || tag === 'div' || tag === 'li';
		if (isBlockChild && raw.length && raw[raw.length - 1].text !== paragraphJoin) {
			raw.push({ text: paragraphJoin });
		}
		el.childNodes.forEach((child) => walk(child, next));
	};

	root.childNodes.forEach((child) => walk(child, style));
	return tidyRuns(raw);
}

/** Merge adjacent runs with identical styling, trim paragraph edges, drop empties. */
function tidyRuns(runs: Run[]): Run[] {
	const merged: Run[] = [];
	for (const run of runs) {
		const prev = merged[merged.length - 1];
		if (prev && sameStyle(prev, run)) {
			prev.text += run.text;
		} else {
			merged.push({ ...run });
		}
	}

	// Collapse whitespace across run boundaries ("a " + " b" → "a " + "b").
	for (let i = 1; i < merged.length; i++) {
		if (/\s$/.test(merged[i - 1].text)) merged[i].text = merged[i].text.replace(/^ +/, '');
	}
	if (merged.length) {
		merged[0].text = merged[0].text.replace(/^\s+/, '');
		merged[merged.length - 1].text = merged[merged.length - 1].text.replace(/\s+$/, '');
	}
	return merged.filter((r) => r.text.length > 0);
}

function sameStyle(a: Run, b: Run): boolean {
	return (
		!!a.bold === !!b.bold && !!a.italic === !!b.italic && !!a.code === !!b.code && a.link === b.link
	);
}

/** Every image referenced by a set of blocks, in reading order. */
export function collectImageRefs(blocks: Block[]): ImageRef[] {
	const refs: ImageRef[] = [];
	for (const b of blocks) {
		if (b.type === 'image') refs.push(b.image);
		else if (b.type === 'gallery') refs.push(...b.images);
	}
	return refs;
}
