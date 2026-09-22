import type { Theme } from './types';

export interface Palette {
	bg: string;
	ink: string;
	ink2: string;
	ink3: string;
	rule: string;
	accent: string;
	title: string;
	link: string;
	code: string;
	codeBg: string;
	imgBorder: string;
}

/** Print-side counterparts of the site's tokens: "paper" flips to cream, "ink" keeps the dark UI. */
export const PALETTES: Record<Theme, Palette> = {
	paper: {
		bg: '#f8f6f1',
		ink: '#141419',
		ink2: '#3d3b36',
		ink3: '#8a857b',
		rule: '#dbd7cc',
		accent: '#e9a90f',
		title: '#141419',
		link: '#8f6600',
		code: '#8f6600',
		codeBg: '#efece4',
		imgBorder: '#d4d0c5'
	},
	ink: {
		bg: '#0a0a0b',
		ink: '#f5f2eb',
		ink2: '#b9b4a8',
		ink3: '#6e6a5f',
		rule: '#26262c',
		accent: '#fbbf24',
		title: '#fbbf24',
		link: '#fbbf24',
		code: '#fbbf24',
		codeBg: '#111114',
		imgBorder: '#26262c'
	}
};
