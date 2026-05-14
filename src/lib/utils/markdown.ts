import { Marked, type Tokens, type TokenizerAndRendererExtension } from 'marked';

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
		const items = ((token as Tokens.Generic).items ?? []) as Tokens.Generic[][];
		const inner = items
			.map((tokens) => `<p>${this.parser.parseInline(tokens)}</p>`)
			.join('');
		return `<div class="image-scroller">${inner}</div>\n`;
	}
};

export const marked = new Marked({ extensions: [scrollerExtension] });
