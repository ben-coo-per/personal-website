/**
 * Multitruchet — a lightweight, framework-agnostic engine for the PIGEON
 * truchet pattern. Use it for backgrounds, text fills, image effects, or
 * standalone animations.
 *
 * Two entry points:
 *
 *   • renderMultitruchet(ctx, config)  — one-shot, draw a single frame.
 *   • new MultitruchetEngine(canvas, opts) — manages DPR sizing, resize,
 *     CSS-token colour resolution, and an optional time-based morph loop.
 *
 * For Svelte, the <Multitruchet /> component in $lib/components wraps the
 * engine with reactive props and visibility/reduced-motion handling.
 *
 * Original full app: ../../../../multitruchet-text.
 */

export * from './motifs';
export * from './noise';
export {
	renderMultitruchet,
	prepareImageReveal,
	sampleColorizeFrames,
	drawRevealTile,
	eraseRevealTile,
	revealCount,
	type RenderConfig,
	type Layer,
	type CanvasSource,
	type MorphStyle,
	type RevealTile,
	type PreparedReveal
} from './core';

import { renderMultitruchet, type RenderConfig, type Layer, type MorphStyle } from './core';
import type { FamilyKey, FamilyFlags } from './motifs';

// ───────────────────────────── defaults ───────────────────────────

/** All seven families enabled. */
export const ALL_FAMILIES: FamilyFlags = {
	plus: true,
	plusDot: true,
	xDot: true,
	diagonal: true,
	straight: true,
	frown: true,
	t: true
};

/** A calmer, more legible default mix (no busy x/+ dots). */
export const DEFAULT_FAMILIES: FamilyFlags = {
	plus: true,
	plusDot: false,
	xDot: false,
	diagonal: true,
	straight: true,
	frown: true,
	t: true
};

/**
 * Base config. Colours default to PIGEON design tokens; the engine resolves
 * `var(--…)` / `--…` strings against the target element at render time, so a
 * bare `'--color-white'` works anywhere the tokens are in scope.
 */
export const DEFAULT_CONFIG: Omit<RenderConfig, 'width' | 'height'> = {
	bg: 'transparent',
	bgFg: '--color-white',
	layers: [],

	rootGrid: 24,
	maxDepth: 0,
	falloff: 3,
	threshold: 0.5,

	textLineWeight: 1 / 3,
	bgLineWeight: 1 / 3,

	families: { ...DEFAULT_FAMILIES },
	seed: 1,

	morphStyle: 'fizzle',
	morphJitter: 0.05,

	bgMode: 'flat',
	contourCount: 5,
	noiseScale: 2,
	noiseOctaves: 4,

	fontFamily: 'var(--font-display)',
	fontWeight: '700',
	fontStyle: 'normal',
	tracking: 0,
	imageFit: 'cover'
};

// ───────────────────────────── presets ────────────────────────────

export type PresetName = 'background' | 'topo' | 'text' | 'image' | 'dense' | 'coarse';

/**
 * Ready-made starting points. Merge order is
 *   DEFAULT_CONFIG → preset → caller overrides.
 */
export const PRESETS: Record<PresetName, Partial<RenderConfig>> = {
	// Uniform full-canvas field — the drop-in replacement for the static PNG.
	background: { rootGrid: 24, maxDepth: 0, bgMode: 'flat' },
	// Same, but with banded-noise density variation.
	topo: { rootGrid: 22, maxDepth: 0, bgMode: 'topo', contourCount: 5, noiseScale: 2 },
	// A text mask filled with motifs, detail concentrated on the letterforms.
	text: { rootGrid: 10, maxDepth: 3, falloff: 3, textLineWeight: 1 / 3 },
	// An image mask.
	image: { rootGrid: 12, maxDepth: 3, falloff: 3, imageFit: 'cover' },
	// Fine grid, good for large hero areas.
	dense: { rootGrid: 40, maxDepth: 0 },
	// Chunky grid, good for small cards / accents.
	coarse: { rootGrid: 12, maxDepth: 0 }
};

/** Build a full RenderConfig from a preset + overrides + explicit size. */
export function buildConfig(
	width: number,
	height: number,
	opts: Partial<RenderConfig> & { preset?: PresetName } = {}
): RenderConfig {
	const { preset, ...rest } = opts;
	const presetCfg = preset ? PRESETS[preset] : {};
	return {
		...DEFAULT_CONFIG,
		...presetCfg,
		...rest,
		// Always honour the caller's families object fully if provided.
		families: rest.families ?? presetCfg.families ?? DEFAULT_CONFIG.families,
		width,
		height
	};
}

// ─────────────────────── colour resolution ────────────────────────

/**
 * Resolve a colour that may be a CSS custom property reference into a literal
 * canvas-usable colour. Accepts `'--color-white'`, `'var(--color-white)'`,
 * `'var(--x, #fff)'`, or any normal CSS colour (returned unchanged).
 * `'transparent'` passes through (the core treats it as the erase sentinel).
 */
export function resolveCssColor(el: Element, value: string): string {
	if (!value) return value;
	const v = value.trim();
	if (v === 'transparent') return v;
	if (v.startsWith('--')) {
		return getComputedStyle(el).getPropertyValue(v).trim() || v;
	}
	const m = v.match(/^var\((--[^,)]+)(?:,([^)]+))?\)$/);
	if (m) {
		const got = getComputedStyle(el).getPropertyValue(m[1].trim()).trim();
		return got || (m[2] ? m[2].trim() : v);
	}
	return v;
}

function resolveConfigColors(el: Element, config: RenderConfig): RenderConfig {
	return {
		...config,
		bg: resolveCssColor(el, config.bg),
		bgFg: resolveCssColor(el, config.bgFg),
		layers: config.layers.map((l) => ({ ...l, color: resolveCssColor(el, l.color) })),
		fontFamily: config.fontFamily ? resolveFontFamily(el, config.fontFamily) : config.fontFamily
	};
}

// Fonts can also be token references (e.g. 'var(--font-display)').
function resolveFontFamily(el: Element, value: string): string {
	const v = value.trim();
	if (v.startsWith('--') || v.startsWith('var(')) {
		const resolved = resolveCssColor(el, v); // same lookup mechanism
		return resolved && resolved !== v ? resolved : 'sans-serif';
	}
	return value;
}

// ───────────────────────── animation driver ───────────────────────

export interface EngineOptions extends Partial<RenderConfig> {
	preset?: PresetName;
	// Re-stated from RenderConfig so they surface directly on the engine API
	// (inherited via Partial<RenderConfig>, but explicit here for discoverability).
	/** Progressive mask reveal in [0,1] — drive from scroll for a dissolve. */
	maskReveal?: number;
	maskRevealStyle?: MorphStyle;
	maskRevealJitter?: number;
	/** Animate by morphing through these seeds. ≥2 needed for motion. */
	animate?: boolean;
	/** Seeds to cycle. Defaults to a few derived from `seed`. */
	seeds?: number[];
	/** Morph (cross-fade) duration per step, ms. */
	transitionMs?: number;
	/** Dwell on each seed before the next morph, ms. */
	holdMs?: number;
	/** Ease the morph (smoothstep) vs. linear. */
	easing?: boolean;
	/** Cap the frame rate (0 = native rAF). */
	fps?: number;
	/** Device-pixel-ratio cap for the backing store. */
	dprCap?: number;
	/** Honour `prefers-reduced-motion: reduce` by rendering one static frame. */
	respectReducedMotion?: boolean;
}

const ENGINE_DEFAULTS = {
	animate: false,
	transitionMs: 1400,
	holdMs: 600,
	easing: true,
	fps: 0,
	dprCap: 2,
	respectReducedMotion: true
};

function easeInOut(x: number): number {
	return x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x);
}

/**
 * Drives a pattern onto a single <canvas>: owns DPR-correct sizing, an
 * optional morph loop, and colour-token resolution. DOM-aware but tiny — the
 * Svelte component is just a reactive shell over this.
 */
export class MultitruchetEngine {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private opts: EngineOptions & typeof ENGINE_DEFAULTS;
	private cssW = 0;
	private cssH = 0;
	private raf = 0;
	private startTs = 0;
	private lastDraw = -Infinity;
	private running = false;

	constructor(canvas: HTMLCanvasElement, opts: EngineOptions = {}) {
		this.canvas = canvas;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('multitruchet: 2D context unavailable');
		this.ctx = ctx;
		this.opts = { ...ENGINE_DEFAULTS, ...opts };
		this.resize();
	}

	/** Merge new options and re-render (restarting the loop if needed). */
	setOptions(patch: EngineOptions): void {
		this.opts = { ...this.opts, ...patch };
		if (this.shouldAnimate()) this.start();
		else {
			this.stop();
			this.renderFrame();
		}
	}

	/** Re-read the element's CSS size and rebuild the DPR backing store. */
	resize(): void {
		const rect = this.canvas.getBoundingClientRect();
		const cssW = Math.max(1, Math.round(rect.width));
		const cssH = Math.max(1, Math.round(rect.height));
		const dpr = Math.min(this.opts.dprCap, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
		this.cssW = cssW;
		this.cssH = cssH;
		this.canvas.width = Math.max(1, Math.round(cssW * dpr));
		this.canvas.height = Math.max(1, Math.round(cssH * dpr));
		if (!this.running) this.renderFrame();
	}

	start(): void {
		if (!this.shouldAnimate()) {
			this.renderFrame();
			return;
		}
		if (this.running) return;
		this.running = true;
		this.startTs = now();
		this.lastDraw = -Infinity;
		const tick = () => {
			if (!this.running) return;
			this.renderAnimatedFrame(now() - this.startTs);
			this.raf = requestAnimationFrame(tick);
		};
		this.raf = requestAnimationFrame(tick);
	}

	stop(): void {
		this.running = false;
		if (this.raf) cancelAnimationFrame(this.raf);
		this.raf = 0;
	}

	destroy(): void {
		this.stop();
	}

	private shouldAnimate(): boolean {
		if (!this.opts.animate) return false;
		if (this.opts.respectReducedMotion && prefersReducedMotion()) return false;
		return this.seeds().length >= 2;
	}

	private seeds(): number[] {
		if (this.opts.seeds && this.opts.seeds.length) return this.opts.seeds;
		const base = this.opts.seed ?? DEFAULT_CONFIG.seed;
		// A few well-separated seeds derived from the base.
		return [base, base + 101, base + 202, base + 303];
	}

	private baseConfig(): RenderConfig {
		// Strip the engine-only keys; what remains is a RenderConfig override.
		const o = this.opts as EngineOptions;
		const render: Partial<RenderConfig> & { preset?: PresetName } = {};
		const engineKeys = new Set([
			'animate',
			'seeds',
			'transitionMs',
			'holdMs',
			'easing',
			'fps',
			'dprCap',
			'respectReducedMotion'
		]);
		for (const k of Object.keys(o)) {
			if (!engineKeys.has(k)) (render as Record<string, unknown>)[k] = (o as Record<string, unknown>)[k];
		}
		const cfg = buildConfig(this.canvas.width, this.canvas.height, render);
		return resolveConfigColors(this.canvas, cfg);
	}

	private renderFrame(): void {
		if (this.canvas.width === 0 || this.canvas.height === 0) return;
		renderMultitruchet(this.ctx, this.baseConfig());
	}

	private renderAnimatedFrame(elapsed: number): void {
		const { fps, transitionMs, holdMs, easing } = this.opts;
		if (fps > 0) {
			const minDelta = 1000 / fps;
			if (elapsed - this.lastDraw < minDelta) return;
			this.lastDraw = elapsed;
		}
		const seeds = this.seeds();
		const period = transitionMs + holdMs;
		const total = seeds.length * period;
		const tt = total > 0 ? elapsed % total : 0;
		const idx = Math.floor(tt / period);
		const local = tt - idx * period;
		const seedA = seeds[idx];
		const seedB = seeds[(idx + 1) % seeds.length];
		const rawT = transitionMs > 0 ? Math.min(1, local / transitionMs) : 1;
		const morphT = easing ? easeInOut(rawT) : rawT;

		const cfg = this.baseConfig();
		renderMultitruchet(this.ctx, { ...cfg, seed: seedA, seedB, morphT });
	}
}

function now(): number {
	return typeof performance !== 'undefined' ? performance.now() : 0;
}

function prefersReducedMotion(): boolean {
	return (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

export type { FamilyKey, FamilyFlags };
