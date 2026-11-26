/**
 * Multitruchet rendering core: text/image/shape → binary mask → uniform- or
 * variable-depth multi-scale tiling → coloured (or transparent) motifs.
 *
 * Distilled from ../../../../multitruchet-text/src/pipeline.js, with the app
 * shell (DOM controls, localStorage, GIF capture) stripped away and three
 * additions that make it reusable as a generic effect:
 *
 *   1. Transparent rendering — `bg: 'transparent'` erases negative space
 *      instead of painting it, so the result composites over anything.
 *   2. Arbitrary mask sources — a layer can be a `'draw'` callback (paint any
 *      shape/SVG path) in addition to `'text'` and `'image'`.
 *   3. Explicit `width`/`height` instead of a bound canvas, so one renderer
 *      drives visible canvases, offscreen buffers, and exports alike.
 *
 * The pattern covers the whole canvas; layers only choose *which* foreground
 * colour (and, via the distance field, how finely subdivided) each cell is.
 */

import {
	drawMotif,
	enabledMotifVariants,
	ERASE,
	type FamilyFlags,
	type FamilyKey,
	type Ctx2D
} from './motifs';
import { hash, sampleTopoShade } from './noise';

// ───────────────────────────── types ──────────────────────────────

export type CanvasSource =
	| HTMLImageElement
	| HTMLVideoElement
	| HTMLCanvasElement
	| ImageBitmap
	| OffscreenCanvas;

export type MorphStyle = 'fizzle' | 'wipe-x' | 'wipe-y' | 'diag-tl' | 'diag-tr' | 'radial';

/** A mask source: a region the pattern fills with this layer's colour. */
export interface Layer {
	type: 'text' | 'image' | 'draw';
	/** `type: 'text'` — the string to set. */
	text?: string;
	/** `type: 'image'` — anything drawImage() accepts. */
	image?: CanvasSource | null;
	/**
	 * `type: 'draw'` — paint the mask yourself. Fill white where the layer is
	 * "inside"; the canvas starts cleared to black. Coordinates are the
	 * sample-buffer pixels (size passed as w/h).
	 */
	draw?: (ctx: Ctx2D, w: number, h: number) => void;
	/** Foreground colour for this layer's cells. */
	color: string;
	/** Flip inside/outside. */
	invert?: boolean;
	/**
	 * `type: 'image'` — sample the image's *actual colour* per tile instead of
	 * using `color`. Turns the layer into a full-colour truchet mosaic of the
	 * image. Coverage (inside/outside) then comes from the image's alpha, so a
	 * transparent PNG keeps its silhouette and an opaque photo fills its frame.
	 */
	colorize?: boolean;
}

export interface RenderConfig {
	width: number;
	height: number;

	/** Page background. `'transparent'` → erase negative space (overlay mode). */
	bg: string;
	/** Foreground colour for cells not covered by any layer. */
	bgFg: string;
	layers: Layer[];

	/** Tiles across the width. Row count is derived to keep tiles square. */
	rootGrid: number;
	/** Max subdivision depth near layer boundaries (0 = uniform grid). */
	maxDepth: number;
	/** Leaf cells of distance per depth step in the falloff ramp. */
	falloff: number;
	/** Mask binarisation cutoff in [0, 1]. */
	threshold: number;

	/** Bar width as a fraction of the tile, for layer / bg regions. ~0.08–0.48. */
	textLineWeight: number;
	bgLineWeight: number;

	families: FamilyFlags;
	seed: number;

	/** Morph target — when set with `morphT > 0`, tiles cross-fade A→B. */
	seedB?: number;
	morphT?: number;
	morphStyle?: MorphStyle;
	morphJitter?: number;

	/**
	 * Mask reveal in [0, 1] — progressively turns the layers' mask on. At 0 the
	 * layers are absent (pure background field); at 1 the full mask shows. Cells
	 * flip "inside" in the order set by `maskRevealStyle`, so the masked image
	 * precipitates out of the field. Edge subdivision ramps in alongside it.
	 * Unset / ≥1 means fully revealed (no gating, zero cost).
	 */
	maskReveal?: number;
	maskRevealStyle?: MorphStyle;
	maskRevealJitter?: number;

	/**
	 * For colorize layers: subdivide toward internal colour detail, not just the
	 * outer image edge. A cell whose local colour gradient (sum of |ΔR|+|ΔG|+|ΔB|
	 * to its right/down neighbours) exceeds this seeds the distance field, so
	 * `maxDepth` concentrates detail on busy areas and leaves flat areas coarse.
	 * Lower = more subdivision. Default ~80.
	 */
	detailThreshold?: number;

	/** 'flat' or 'topo' (banded-noise density modulation of bg tiles). */
	bgMode?: 'flat' | 'topo';
	contourCount?: number;
	noiseScale?: number;
	noiseOctaves?: number;

	/** Text sampling. */
	fontFamily?: string;
	fontWeight?: string | number;
	fontStyle?: string;
	tracking?: number;
	/** Image sampling. */
	imageFit?: 'cover' | 'contain' | 'stretch';
}

interface Samples {
	coverage: Float32Array;
	sizeX: number;
	sizeY: number;
	/** Per-cell mean colour (RGBA, length 4·N) — only for colorize layers. */
	colors?: Uint8ClampedArray;
}

interface Tile {
	x: number;
	y: number;
	size: number;
	depth: number;
	layerIdx: number; // -1 = no layer (bg)
	/** Sampled colour for colorize layers; overrides the layer's flat colour. */
	color?: string;
	/** Leaf-grid cell index this tile took its colour from (for recolouring per
	 *  animation frame — see sampleColorizeFrames). */
	cell?: number;
}

// ─────────────────────────── canvas helpers ───────────────────────

function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
	if (typeof document !== 'undefined') {
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		return c;
	}
	if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
	throw new Error('multitruchet: no canvas implementation available');
}

// 4× oversample of the leaf grid is plenty for anti-aliased coverage; cap at
// 2048 to bound work for very deep subdivisions.
function samplePxFor(leafGrid: number): number {
	return Math.min(2048, Math.max(512, leafGrid * 4));
}

// ─────────────────────────── grid geometry ────────────────────────

function gridDimsFor(rootGrid: number, maxDepth: number, width: number, height: number) {
	const tileSize = width / rootGrid;
	const rootGridY = Math.max(1, Math.round(height / tileSize));
	const leafSpan = 1 << maxDepth;
	return {
		rootGridX: rootGrid,
		rootGridY,
		leafGridX: rootGrid * leafSpan,
		leafGridY: rootGridY * leafSpan,
		leafSpan,
		tileSize
	};
}

// ───────────────────────────── sampling ───────────────────────────

function makeSampleCanvas(leafGridX: number, leafGridY: number, transparent = false) {
	const samplePxX = samplePxFor(Math.max(leafGridX, leafGridY));
	const cellPx = samplePxX / leafGridX;
	const samplePxY = Math.max(1, Math.round(leafGridY * cellPx));
	const can = makeCanvas(samplePxX, samplePxY);
	const ctx = can.getContext('2d', { willReadFrequently: true }) as Ctx2D;
	// Mask sampling wants a black (outside) backdrop; colour sampling wants a
	// transparent one so the image's own alpha defines coverage.
	if (!transparent) {
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, samplePxX, samplePxY);
	}
	return { can, ctx, samplePxX, samplePxY };
}

// Downsample a black/white source into a leafGridX × leafGridY coverage grid.
// Each cell ∈ [0,1] is mean luminance (white → 1 inside, black → 0 outside).
function rasterToCoverage(
	can: HTMLCanvasElement | OffscreenCanvas,
	leafGridX: number,
	leafGridY: number,
	invert: boolean
): Samples {
	const samplePxX = can.width;
	const samplePxY = can.height;
	const ctx = can.getContext('2d', { willReadFrequently: true }) as Ctx2D;
	const img = ctx.getImageData(0, 0, samplePxX, samplePxY).data;
	const coverage = new Float32Array(leafGridX * leafGridY);
	const cellPxX = samplePxX / leafGridX;
	const cellPxY = samplePxY / leafGridY;
	for (let cy = 0; cy < leafGridY; cy++) {
		const y0 = Math.floor(cy * cellPxY);
		const y1 = Math.floor((cy + 1) * cellPxY);
		for (let cx = 0; cx < leafGridX; cx++) {
			const x0 = Math.floor(cx * cellPxX);
			const x1 = Math.floor((cx + 1) * cellPxX);
			let sum = 0;
			let n = 0;
			const stride = Math.max(1, Math.floor((x1 - x0) / 4));
			for (let y = y0; y < y1; y += stride) {
				for (let x = x0; x < x1; x += stride) {
					sum += img[(y * samplePxX + x) * 4];
					n++;
				}
			}
			const inside = n ? sum / n / 255 : 0;
			coverage[cy * leafGridX + cx] = invert ? 1 - inside : inside;
		}
	}
	return { coverage, sizeX: leafGridX, sizeY: leafGridY };
}

// Like rasterToCoverage, but keeps the mean RGB per cell as well. Coverage is
// the mean alpha (opaque image pixels → inside, transparent → outside), so a
// colour layer fills exactly where the image has content.
function rasterToColor(
	can: HTMLCanvasElement | OffscreenCanvas,
	leafGridX: number,
	leafGridY: number
): Samples {
	const samplePxX = can.width;
	const samplePxY = can.height;
	const ctx = can.getContext('2d', { willReadFrequently: true }) as Ctx2D;
	const img = ctx.getImageData(0, 0, samplePxX, samplePxY).data;
	const N = leafGridX * leafGridY;
	const coverage = new Float32Array(N);
	const colors = new Uint8ClampedArray(N * 4);
	const cellPxX = samplePxX / leafGridX;
	const cellPxY = samplePxY / leafGridY;
	for (let cy = 0; cy < leafGridY; cy++) {
		const y0 = Math.floor(cy * cellPxY);
		const y1 = Math.floor((cy + 1) * cellPxY);
		for (let cx = 0; cx < leafGridX; cx++) {
			const x0 = Math.floor(cx * cellPxX);
			const x1 = Math.floor((cx + 1) * cellPxX);
			let r = 0, g = 0, bl = 0, a = 0, n = 0;
			const stride = Math.max(1, Math.floor((x1 - x0) / 4));
			for (let y = y0; y < y1; y += stride) {
				for (let x = x0; x < x1; x += stride) {
					const p = (y * samplePxX + x) * 4;
					r += img[p];
					g += img[p + 1];
					bl += img[p + 2];
					a += img[p + 3];
					n++;
				}
			}
			const cell = cy * leafGridX + cx;
			if (n) {
				colors[cell * 4] = r / n;
				colors[cell * 4 + 1] = g / n;
				colors[cell * 4 + 2] = bl / n;
				colors[cell * 4 + 3] = 255;
				coverage[cell] = a / n / 255;
			}
		}
	}
	return { coverage, colors, sizeX: leafGridX, sizeY: leafGridY };
}

function sampleLayer(layer: Layer, config: RenderConfig, gx: number, gy: number): Samples {
	const colorize = layer.type === 'image' && !!layer.colorize;
	const { can, ctx, samplePxX, samplePxY } = makeSampleCanvas(gx, gy, colorize);

	if (layer.type === 'draw' && layer.draw) {
		layer.draw(ctx, samplePxX, samplePxY);
	} else if (layer.type === 'image') {
		drawImageMask(ctx, layer.image ?? null, samplePxX, samplePxY, config.imageFit ?? 'cover', colorize);
	} else {
		drawTextMask(ctx, layer.text ?? '', config, samplePxX, samplePxY);
	}
	return colorize
		? rasterToColor(can, gx, gy)
		: rasterToCoverage(can, gx, gy, !!layer.invert);
}

function drawTextMask(
	ctx: Ctx2D,
	text: string,
	config: RenderConfig,
	w: number,
	h: number
): void {
	if (!text.length) return;
	const fontFamily = config.fontFamily ?? 'sans-serif';
	const fontWeight = config.fontWeight ?? '700';
	const fontStyle = config.fontStyle ?? 'normal';
	const tracking = config.tracking ?? 0;

	ctx.fillStyle = '#fff';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	if ('letterSpacing' in ctx) {
		(ctx as CanvasRenderingContext2D).letterSpacing = `${tracking}em`;
	}
	// Auto-fit a font size into 92% of the buffer (binary search).
	const maxW = w * 0.92;
	const maxH = h * 0.92;
	let lo = 8;
	let hi = Math.max(w, h);
	let fit = lo;
	for (let i = 0; i < 18; i++) {
		const mid = (lo + hi) / 2;
		ctx.font = `${fontStyle} ${fontWeight} ${mid}px ${fontFamily}`;
		const m = ctx.measureText(text);
		const tw = m.width;
		const th =
			(m.actualBoundingBoxAscent ?? mid * 0.75) + (m.actualBoundingBoxDescent ?? mid * 0.25);
		if (tw <= maxW && th <= maxH) {
			fit = mid;
			lo = mid;
		} else {
			hi = mid;
		}
	}
	ctx.font = `${fontStyle} ${fontWeight} ${fit}px ${fontFamily}`;
	ctx.fillText(text, w / 2, h / 2);
}

function drawImageMask(
	ctx: Ctx2D,
	img: CanvasSource | null,
	w: number,
	h: number,
	fit: 'cover' | 'contain' | 'stretch',
	color = false
): void {
	if (!img) return;
	// Intrinsic dimensions: <img> exposes naturalWidth, <video> exposes
	// videoWidth, and bitmaps/canvases only have width/height. (A live media
	// element's .width is its *layout* size, so prefer the intrinsic field —
	// drawImage samples full resolution regardless of CSS size.)
	const iw =
		(img as HTMLImageElement).naturalWidth ||
		(img as HTMLVideoElement).videoWidth ||
		(img as HTMLCanvasElement).width;
	const ih =
		(img as HTMLImageElement).naturalHeight ||
		(img as HTMLVideoElement).videoHeight ||
		(img as HTMLCanvasElement).height;
	if (!iw || !ih) return;
	let dx: number, dy: number, dw: number, dh: number;
	if (fit === 'stretch') {
		dx = 0;
		dy = 0;
		dw = w;
		dh = h;
	} else {
		const scale = fit === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
		dw = iw * scale;
		dh = ih * scale;
		dx = (w - dw) / 2;
		dy = (h - dh) / 2;
	}
	// Mask mode flattens to luminance; colour mode keeps the image's RGB.
	ctx.filter = color ? 'none' : 'grayscale(100%)';
	ctx.drawImage(img as CanvasImageSource, dx, dy, dw, dh);
	ctx.filter = 'none';
}

// ─────────────────────── distance field + tiling ──────────────────

interface DistField {
	dist: Int32Array;
	topLayer: Int8Array;
	sizeX: number;
	sizeY: number;
}

// Chebyshev-distance field on the combined boundary of every layer's binary
// mask, plus per-cell `topLayer` (highest-priority layer inside, or -1).
// Two-pass forward/backward sweep — O(N·L).
function combinedDistanceField(layerSamples: Samples[], config: RenderConfig): DistField {
	const { sizeX, sizeY } = layerSamples[0];
	const N = sizeX * sizeY;
	const L = layerSamples.length;
	const threshold = config.threshold;

	// Optional progressive reveal: gate "inside" cells by a per-cell threshold
	// so the mask fades in cell-by-cell (see revealThreshold). Skipped entirely
	// when fully revealed, so the common case pays nothing.
	const reveal = config.maskReveal ?? 1;
	const gated = reveal < 1;
	const revealSeed = config.seed ?? 1;
	const revealStyle = config.maskRevealStyle ?? 'fizzle';
	const revealJit = config.maskRevealJitter ?? (revealStyle === 'fizzle' ? 0 : 0.06);

	const insides = layerSamples.map((m) => {
		const arr = new Uint8Array(N);
		for (let i = 0; i < N; i++) {
			let on = m.coverage[i] >= threshold ? 1 : 0;
			if (on && gated) {
				if (reveal <= 0) on = 0;
				else {
					const x = i % sizeX;
					const y = (i / sizeX) | 0;
					const r = revealThreshold(x, y, sizeX, sizeY, revealStyle, revealSeed, revealJit);
					if (reveal < r) on = 0;
				}
			}
			arr[i] = on;
		}
		return arr;
	});

	const topLayer = new Int8Array(N);
	for (let i = 0; i < N; i++) {
		let top = -1;
		for (let k = L - 1; k >= 0; k--) {
			if (insides[k][i]) {
				top = k;
				break;
			}
		}
		topLayer[i] = top;
	}

	const INF = (sizeX + sizeY) * 2;
	const dist = new Int32Array(N).fill(INF);
	// Seed boundary cells: any cell where ANY layer differs from a neighbour.
	for (let y = 0; y < sizeY; y++) {
		for (let x = 0; x < sizeX; x++) {
			const i = y * sizeX + x;
			let onBoundary = false;
			for (let k = 0; k < L && !onBoundary; k++) {
				// A colorize layer's outer edge is just the image's rectangle, not
				// real detail — don't subdivide along it (detail pass handles the
				// interior). Its inside/outside still drives colouring via topLayer.
				if (layerSamples[k].colors) continue;
				const ins = insides[k];
				const v = ins[i];
				if (
					(x > 0 && ins[i - 1] !== v) ||
					(x < sizeX - 1 && ins[i + 1] !== v) ||
					(y > 0 && ins[i - sizeX] !== v) ||
					(y < sizeY - 1 && ins[i + sizeX] !== v)
				) {
					onBoundary = true;
				}
			}
			if (onBoundary) dist[i] = 0;
		}
	}
	// Colorize detail: also seed the field at strong internal colour edges, so
	// subdivision tracks the image's detail (e.g. a car's contours) instead of
	// only the outer frame. One cheap forward-difference pass per colour layer.
	const detailThresh = config.detailThreshold ?? 80;
	for (const m of layerSamples) {
		const c = m.colors;
		if (!c) continue;
		const cov = m.coverage;
		for (let y = 0; y < sizeY; y++) {
			for (let x = 0; x < sizeX; x++) {
				const i = y * sizeX + x;
				if (dist[i] === 0) continue;
				// Interior only: skip cells outside the image, and only diff against
				// neighbours that are also inside — so the image's edge against the
				// transparent margin never counts as detail.
				if (cov[i] < threshold) continue;
				let g = 0;
				if (x < sizeX - 1 && cov[i + 1] >= threshold) {
					const j = i + 1;
					g += Math.abs(c[i * 4] - c[j * 4]) + Math.abs(c[i * 4 + 1] - c[j * 4 + 1]) + Math.abs(c[i * 4 + 2] - c[j * 4 + 2]);
				}
				if (y < sizeY - 1 && cov[i + sizeX] >= threshold) {
					const j = i + sizeX;
					g += Math.abs(c[i * 4] - c[j * 4]) + Math.abs(c[i * 4 + 1] - c[j * 4 + 1]) + Math.abs(c[i * 4 + 2] - c[j * 4 + 2]);
				}
				if (g > detailThresh) dist[i] = 0;
			}
		}
	}
	// Forward sweep (N, NW, W, NE neighbours).
	for (let y = 0; y < sizeY; y++) {
		for (let x = 0; x < sizeX; x++) {
			const i = y * sizeX + x;
			let d = dist[i];
			if (y > 0) {
				if (x > 0) d = Math.min(d, dist[i - sizeX - 1] + 1);
				d = Math.min(d, dist[i - sizeX] + 1);
				if (x < sizeX - 1) d = Math.min(d, dist[i - sizeX + 1] + 1);
			}
			if (x > 0) d = Math.min(d, dist[i - 1] + 1);
			dist[i] = d;
		}
	}
	// Backward sweep (S, SE, E, SW neighbours).
	for (let y = sizeY - 1; y >= 0; y--) {
		for (let x = sizeX - 1; x >= 0; x--) {
			const i = y * sizeX + x;
			let d = dist[i];
			if (y < sizeY - 1) {
				if (x < sizeX - 1) d = Math.min(d, dist[i + sizeX + 1] + 1);
				d = Math.min(d, dist[i + sizeX] + 1);
				if (x > 0) d = Math.min(d, dist[i + sizeX - 1] + 1);
			}
			if (x < sizeX - 1) d = Math.min(d, dist[i + 1] + 1);
			dist[i] = d;
		}
	}
	return { dist, topLayer, sizeX, sizeY };
}

// Recursive emit: each cell's target depth ramps from maxDepth on a layer
// boundary down to 0 far away, so detail concentrates around letterforms.
function emit(
	out: Tile[],
	df: DistField,
	rx: number,
	ry: number,
	rsize: number,
	depth: number,
	lx0: number,
	ly0: number,
	lspan: number,
	maxDepth: number,
	falloff: number,
	colorLayers: (Uint8ClampedArray | null)[]
): void {
	const cx = Math.min(df.sizeX - 1, lx0 + (lspan >> 1));
	const cy = Math.min(df.sizeY - 1, ly0 + (lspan >> 1));
	const i = cy * df.sizeX + cx;
	const d = df.dist[i];
	const targetDepth = Math.max(0, Math.min(maxDepth, maxDepth - Math.floor(d / falloff)));

	if (depth < targetDepth && lspan > 1) {
		const half = rsize / 2;
		const lh = lspan >> 1;
		emit(out, df, rx, ry, half, depth + 1, lx0, ly0, lh, maxDepth, falloff, colorLayers);
		emit(out, df, rx + half, ry, half, depth + 1, lx0 + lh, ly0, lh, maxDepth, falloff, colorLayers);
		emit(out, df, rx, ry + half, half, depth + 1, lx0, ly0 + lh, lh, maxDepth, falloff, colorLayers);
		emit(out, df, rx + half, ry + half, half, depth + 1, lx0 + lh, ly0 + lh, lh, maxDepth, falloff, colorLayers);
		return;
	}
	const li = df.topLayer[i];
	// For a colorize layer, bake the cell's sampled colour onto the tile.
	const cols = li >= 0 ? colorLayers[li] : null;
	const color = cols
		? `rgb(${cols[i * 4]},${cols[i * 4 + 1]},${cols[i * 4 + 2]})`
		: undefined;
	out.push({ x: rx, y: ry, size: rsize, depth, layerIdx: li, color, cell: i });
}

function buildTiles(layerSamples: Samples[], config: RenderConfig): Tile[] {
	const { rootGrid, maxDepth, width, height } = config;
	const { rootGridX, rootGridY, leafSpan, tileSize } = gridDimsFor(
		rootGrid,
		maxDepth,
		width,
		height
	);
	const df = combinedDistanceField(layerSamples, config);
	const f = Math.max(1, config.falloff ?? 3);
	// Ramp edge detail in with the reveal so subdivision sharpens as the mask
	// resolves, rather than popping to full depth the instant a cell turns on.
	const reveal = config.maskReveal ?? 1;
	const effMaxDepth = reveal >= 1 ? maxDepth : Math.max(0, Math.round(maxDepth * smooth01(reveal)));
	const colorLayers = layerSamples.map((s) => s.colors ?? null);
	const tiles: Tile[] = [];
	for (let ry = 0; ry < rootGridY; ry++) {
		for (let rx = 0; rx < rootGridX; rx++) {
			emit(
				tiles,
				df,
				rx * tileSize,
				ry * tileSize,
				tileSize,
				0,
				rx * leafSpan,
				ry * leafSpan,
				leafSpan,
				effMaxDepth,
				f,
				colorLayers
			);
		}
	}
	// Winged tiles: smaller (deeper) tiles paint on top of larger ones.
	tiles.sort((a, b) => a.depth - b.depth);
	return tiles;
}

// ─────────────────────────── morph helpers ────────────────────────

function morphField(
	tile: Tile,
	style: MorphStyle,
	width: number,
	height: number,
	seed: number
): number {
	const size = tile.size;
	const cx = tile.x + size / 2;
	const cy = tile.y + size / 2;
	switch (style) {
		case 'wipe-x':
			return cx / width;
		case 'wipe-y':
			return cy / height;
		case 'diag-tl': {
			const v = (tile.x / width + tile.y / height + size / Math.max(width, height)) / 2;
			return Math.max(0, Math.min(1, v));
		}
		case 'diag-tr': {
			const v = ((width - tile.x) / width + tile.y / height + size / Math.max(width, height)) / 2;
			return Math.max(0, Math.min(1, v));
		}
		case 'radial': {
			const mx = width / 2;
			const my = height / 2;
			const dx = cx - mx;
			const dy = cy - my;
			const norm = Math.sqrt(mx * mx + my * my);
			return Math.min(1, Math.sqrt(dx * dx + dy * dy) / norm);
		}
		case 'fizzle':
		default:
			return hash(tile.x | 0, tile.y | 0, tile.depth, (seed | 0) ^ 0xfeed);
	}
}

function jitter(tile: Tile, seed: number, amp: number): number {
	return (hash(tile.x | 0, tile.y | 0, tile.depth, (seed | 0) ^ 0xc0fe) - 0.5) * 2 * amp;
}

function smooth01(t: number): number {
	const x = t < 0 ? 0 : t > 1 ? 1 : t;
	return x * x * (3 - 2 * x);
}

/**
 * Per-cell reveal threshold in [0, 1]: a cell becomes part of the mask once
 * `maskReveal >= threshold`. `fizzle` scatters cells randomly (image
 * precipitates out of noise); the directional styles sweep a soft edge across
 * the grid. `jit` roughens the directional edges so they don't read as a ruler
 * line.
 */
function revealThreshold(
	x: number,
	y: number,
	sizeX: number,
	sizeY: number,
	style: MorphStyle,
	seed: number,
	jit: number
): number {
	const nx = sizeX > 1 ? x / (sizeX - 1) : 0;
	const ny = sizeY > 1 ? y / (sizeY - 1) : 0;
	let base: number;
	switch (style) {
		case 'wipe-x':
			base = nx;
			break;
		case 'wipe-y':
			base = ny;
			break;
		case 'diag-tl':
			base = (nx + ny) / 2;
			break;
		case 'diag-tr':
			base = (1 - nx + ny) / 2;
			break;
		case 'radial': {
			const dx = nx - 0.5;
			const dy = ny - 0.5;
			base = Math.min(1, Math.sqrt(dx * dx + dy * dy) / Math.SQRT1_2);
			break;
		}
		case 'fizzle':
		default:
			// Pure scatter — no directional bias.
			return hash(x | 0, y | 0, 0, (seed | 0) ^ 0x5eed);
	}
	if (jit > 0) base += (hash(x | 0, y | 0, 0, (seed | 0) ^ 0x5eed) - 0.5) * 2 * jit;
	return base < 0 ? 0 : base > 1 ? 1 : base;
}

// ───────────────────────────── render ─────────────────────────────

/** Render one full frame of the pattern into `ctx`. */
export function renderMultitruchet(ctx: Ctx2D, config: RenderConfig): void {
	const { width, height, bg } = config;
	const transparent = bg === 'transparent';

	if (transparent) ctx.clearRect(0, 0, width, height);
	else {
		ctx.globalCompositeOperation = 'source-over';
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, width, height);
	}

	const layers = config.layers ?? [];
	const gridDims = gridDimsFor(config.rootGrid, config.maxDepth, width, height);
	const layerSamples =
		layers.length > 0
			? layers.map((l) => sampleLayer(l, config, gridDims.leafGridX, gridDims.leafGridY))
			: [emptySamples(gridDims.leafGridX, gridDims.leafGridY)];

	const tiles = buildTiles(layerSamples, config);
	renderTiles(ctx, tiles, layers, config, transparent);
}

// ───────────────────── incremental image reveal ───────────────────
//
// renderMultitruchet redraws every tile each call — fine for a static frame,
// far too slow to animate a 27k-tile colorize photo (the whole pattern is
// re-issued ~60×/s). For an animated reveal we instead precompute the tile set
// ONCE, then draw/erase only the handful of tiles that cross the dissolve
// threshold each frame. This trades one full render for cheap per-frame deltas.

/** A single precomputed tile, ready to stamp incrementally. */
export interface RevealTile {
	x: number;
	y: number;
	size: number;
	family: FamilyKey;
	rotation: number;
	weight: number;
	/** Opaque fill colour (the image's sampled colour for this tile). */
	color: string;
	/** Subdivision depth — drives the parity flip so colours invert per level. */
	depth: number;
	/** Dissolve threshold in [0,1): the tile appears once reveal ≥ this. */
	threshold: number;
	/** Leaf-grid cell index — indexes a frame colour buffer from
	 *  sampleColorizeFrames so the tile can be recoloured per animation frame
	 *  without rebuilding geometry. */
	cell: number;
}

export interface PreparedReveal {
	width: number;
	height: number;
	/** Image tiles only (field stays transparent), sorted by threshold asc. */
	tiles: RevealTile[];
	/** Parallel sorted thresholds, for a fast upper-bound on reveal. */
	thresholds: Float64Array;
}

/**
 * Precompute the full-detail tile set for an image layer's reveal. Run once per
 * (image, size); the result drives drawRevealTile/eraseRevealTile per frame.
 */
export function prepareImageReveal(config: RenderConfig): PreparedReveal {
	// Full set, no reveal gating or depth ramp — we animate by drawing, not by
	// re-tiling.
	const cfg: RenderConfig = { ...config, maskReveal: 1 };
	const { width, height } = cfg;
	const gridDims = gridDimsFor(cfg.rootGrid, cfg.maxDepth, width, height);
	const layers = cfg.layers ?? [];
	const layerSamples =
		layers.length > 0
			? layers.map((l) => sampleLayer(l, cfg, gridDims.leafGridX, gridDims.leafGridY))
			: [emptySamples(gridDims.leafGridX, gridDims.leafGridY)];
	const tiles = buildTiles(layerSamples, cfg);

	const variants = enabledMotifVariants(cfg.families);
	const weight = cfg.textLineWeight ?? 1 / 3;
	const seed = cfg.seed;
	const style = cfg.maskRevealStyle ?? 'fizzle';
	const jit = cfg.maskRevealJitter ?? (style === 'fizzle' ? 0 : 0.06);
	const lgx = gridDims.leafGridX;
	const lgy = gridDims.leafGridY;

	const out: RevealTile[] = [];
	if (variants.length) {
		for (const t of tiles) {
			if (t.layerIdx < 0) continue; // outside the image → stays field
			const rx = Math.round(t.x);
			const ry = Math.round(t.y);
			const [family, rotation] = variants[Math.floor(hash(rx, ry, t.depth, seed) * variants.length)];
			const cx = Math.min(lgx - 1, Math.floor(((t.x + t.size / 2) * lgx) / width));
			const cy = Math.min(lgy - 1, Math.floor(((t.y + t.size / 2) * lgy) / height));
			const threshold = revealThreshold(cx, cy, lgx, lgy, style, seed, jit);
			out.push({ x: t.x, y: t.y, size: t.size, family, rotation, weight, color: t.color ?? '#fff', depth: t.depth, threshold, cell: t.cell ?? 0 });
		}
	}
	out.sort((a, b) => a.threshold - b.threshold);
	const thresholds = new Float64Array(out.length);
	for (let i = 0; i < out.length; i++) thresholds[i] = out[i].threshold;
	return { width, height, tiles: out, thresholds };
}

/**
 * Sample a sequence of images into per-cell colour buffers over the SAME leaf
 * grid `prepareImageReveal` uses, so an animated colorize reveal can advance
 * through frames without rebuilding tile geometry. Each returned buffer is
 * RGBA, length `leafGridX * leafGridY * 4`, indexed by a tile's `cell`.
 *
 * Pass the SAME `config` you passed to `prepareImageReveal` (its first
 * frame should be the layer image, so frame 0's colours match the prepared
 * tiles). Geometry is shared because for an opaque photo coverage is uniform
 * across frames — only colour changes — so the tile set never moves.
 */
export function sampleColorizeFrames(
	config: RenderConfig,
	images: CanvasSource[]
): Uint8ClampedArray[] {
	const { width, height } = config;
	const { leafGridX, leafGridY } = gridDimsFor(config.rootGrid, config.maxDepth, width, height);
	return images.map((image) => {
		const layer: Layer = { type: 'image', image, color: '#fff', colorize: true };
		const s = sampleLayer(layer, config, leafGridX, leafGridY);
		return s.colors ?? new Uint8ClampedArray(leafGridX * leafGridY * 4);
	});
}

/** Stamp one tile opaquely (bgFill behind, colour motif on top). */
export function drawRevealTile(ctx: Ctx2D, t: RevealTile, bgFill: string): void {
	// Parity colouring: odd-depth children render as the colour-inverse of their
	// parent (matching renderTiles), so the dark lines up across subdivisions.
	const [fg, bg] = t.depth & 1 ? [bgFill, t.color] : [t.color, bgFill];
	// Back the whole cell with its bg colour first. drawMotif only paints bg in
	// the corner discs (it assumes the cell already sits on the bg), so without
	// this an inverted tile would show its photo colour *only* in the corners —
	// a grid of dots — instead of the full complementary motif shape. Filling
	// also makes the tile truly opaque, fully replacing the field beneath. Same
	// rect convention as eraseRevealTile so draw/erase stay aligned.
	ctx.globalCompositeOperation = 'source-over';
	ctx.fillStyle = bg;
	ctx.fillRect(Math.floor(t.x), Math.floor(t.y), Math.ceil(t.size) + 1, Math.ceil(t.size) + 1);
	drawMotif(ctx, t.x, t.y, t.size, t.family, t.rotation, fg, bg, t.weight);
}

/** Remove one tile, exposing whatever is behind the canvas (the field). */
export function eraseRevealTile(ctx: Ctx2D, t: RevealTile): void {
	ctx.clearRect(Math.floor(t.x), Math.floor(t.y), Math.ceil(t.size) + 1, Math.ceil(t.size) + 1);
}

/** Index of the first tile whose threshold exceeds `reveal` (= count revealed). */
export function revealCount(thresholds: Float64Array, reveal: number): number {
	let lo = 0;
	let hi = thresholds.length;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (thresholds[mid] <= reveal) lo = mid + 1;
		else hi = mid;
	}
	return lo;
}

// When there are no layers, build a single all-outside sample so the whole
// canvas renders as one uniform truchet field (a pure background).
function emptySamples(sizeX: number, sizeY: number): Samples {
	return { coverage: new Float32Array(sizeX * sizeY), sizeX, sizeY };
}

function renderTiles(
	ctx: Ctx2D,
	tiles: Tile[],
	layers: Layer[],
	config: RenderConfig,
	transparent: boolean
): void {
	const {
		width,
		height,
		bgFg,
		bg,
		seed,
		textLineWeight,
		bgLineWeight,
		families,
		seedB,
		morphT,
		morphStyle,
		morphJitter,
		bgMode,
		contourCount,
		noiseScale,
		noiseOctaves
	} = config;

	const variants = enabledMotifVariants(families);
	if (!variants.length || !tiles.length) return;

	// In transparent mode the "background colour" of every tile is the erase
	// sentinel, so negative space punches through.
	const fillBg = transparent ? ERASE : bg;
	const layerColors = (layers ?? []).map((l) => l.color || bgFg);

	const textWeight = textLineWeight ?? 1 / 3;
	const bgWeight = bgLineWeight ?? 1 / 3;

	const topo = bgMode === 'topo';
	const topoOpts = {
		noiseScale: noiseScale ?? 2,
		noiseOctaves: noiseOctaves ?? 4,
		bands: contourCount ?? 5
	};
	const topoStrength = 0.5;

	const morphActive = seedB !== undefined && seedB !== null && (morphT ?? 0) > 0;
	const pureB = morphActive && (morphT ?? 0) >= 1;
	const style = morphStyle ?? 'fizzle';
	const jAmp = morphJitter ?? 0.05;

	for (const t of tiles) {
		const x = Math.round(t.x);
		const y = Math.round(t.y);
		let idx: number;
		let useSeedB = false;
		if (!morphActive) {
			idx = Math.floor(hash(x, y, t.depth, seed) * variants.length);
		} else if (pureB) {
			idx = Math.floor(hash(x, y, t.depth, seedB!) * variants.length);
			useSeedB = true;
		} else {
			const idxA = Math.floor(hash(x, y, t.depth, seed) * variants.length);
			const idxB = Math.floor(hash(x, y, t.depth, seedB!) * variants.length);
			const field = morphField(t, style, width, height, seed);
			const tSwap = Math.max(0, Math.min(1, field + jitter(t, seed, jAmp)));
			if ((morphT ?? 0) >= tSwap) {
				idx = idxB;
				useSeedB = true;
			} else {
				idx = idxA;
			}
		}

		const [family, rotation] = variants[idx];
		const isBg = t.layerIdx < 0;
		// A colorize layer bakes its sampled colour onto the tile; otherwise use
		// the layer's flat colour (or the background colour for bg tiles).
		const fgColor = t.color ?? (isBg ? bgFg : layerColors[t.layerIdx] ?? bgFg);
		// Parity colouring: odd-depth children render as the colour-inverse of
		// their parent so subdivisions read cleanly (Carlson §"Winged Tiles").
		const [tileFg, tileBg] = t.depth & 1 ? [fillBg, fgColor] : [fgColor, fillBg];

		let weight = isBg ? bgWeight : textWeight;
		if (topo && isBg) {
			const shade = sampleTopoShade(t, useSeedB ? seedB! : seed, topoOpts);
			weight = Math.max(0.08, Math.min(0.48, weight * (1 + shade * topoStrength)));
		}

		drawMotif(ctx, t.x, t.y, t.size, family, rotation, tileFg, tileBg, weight);
	}
}
