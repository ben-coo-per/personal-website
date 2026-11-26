/**
 * Multitruchet motif geometry.
 *
 * Ported from ../../../../multitruchet-text/src/motifs.js (itself a port of
 * the Rust `truchet-render` motif set). Kept framework-agnostic: it only
 * touches a CanvasRenderingContext2D, so it works against a visible canvas,
 * an OffscreenCanvas, or a node-canvas in tests.
 *
 * Convention: each tile occupies the unit square [0,1]×[0,1]. Body paths are
 * filled with `fg`; four quarter-disc corners of radius 0.5−w/2 are restored
 * to `bg`; four edge-midpoint dots of radius w/2 are filled `fg`. `weight`
 * scales the bar width from the stock 1/3.
 *
 * Transparency: pass the literal string `'transparent'` as `fg` or `bg` and
 * that pass paints with `destination-out` (i.e. it *erases* instead of
 * filling). This is what lets the same geometry render either as opaque
 * two-tone tiles or as ink-on-nothing for overlays / text fills.
 */

export type FamilyKey =
	| 'plus'
	| 'plusDot'
	| 'xDot'
	| 'diagonal'
	| 'straight'
	| 'frown'
	| 't';

export interface Family {
	key: FamilyKey;
	/** Number of distinct rotations this family contributes to the variant pool. */
	orientations: number;
}

/** A concrete motif: a family plus a rotation index. */
export type Variant = [FamilyKey, number];

export type FamilyFlags = Partial<Record<FamilyKey, boolean>>;

/** Any 2D context we can draw into (DOM canvas or OffscreenCanvas). */
export type Ctx2D =
	| CanvasRenderingContext2D
	| OffscreenCanvasRenderingContext2D;

export const FAMILIES: readonly Family[] = [
	{ key: 'plus', orientations: 1 },
	{ key: 'plusDot', orientations: 1 },
	{ key: 'xDot', orientations: 1 },
	{ key: 'diagonal', orientations: 2 },
	{ key: 'straight', orientations: 2 },
	{ key: 'frown', orientations: 4 },
	{ key: 't', orientations: 4 }
];

/** Expand the enabled-family flags into the flat pool of drawable variants. */
export function enabledMotifVariants(flags: FamilyFlags): Variant[] {
	const out: Variant[] = [];
	for (const f of FAMILIES) {
		if (!flags[f.key]) continue;
		for (let r = 0; r < f.orientations; r++) out.push([f.key, r]);
	}
	return out;
}

/**
 * Sentinel colour meaning "erase this pass instead of painting it". When a
 * tile renders against a transparent background, the carve / parity passes
 * use this so they punch holes rather than painting an opaque colour.
 */
export const ERASE = 'transparent';

function setInk(ctx: Ctx2D, color: string): void {
	if (color === ERASE) {
		ctx.globalCompositeOperation = 'destination-out';
		ctx.fillStyle = '#000';
	} else {
		ctx.globalCompositeOperation = 'source-over';
		ctx.fillStyle = color;
	}
}

/**
 * Draw one motif into the square anchored at (x, y) of side `size`.
 * `fg`/`bg` are CSS colour strings (or `ERASE`). `weight ∈ (0, 0.5]`.
 */
export function drawMotif(
	ctx: Ctx2D,
	x: number,
	y: number,
	size: number,
	family: FamilyKey,
	rotation: number,
	fg: string,
	bg: string,
	weight = 1 / 3
): void {
	const half = weight / 2; // half-width of a bar
	const cornerR = 0.5 - half; // bg corner disc radius (so corner meets bar)
	const edgeDotR = half; // edge-midpoint dot radius (== bar half-width)

	ctx.save();
	ctx.translate(x, y);
	ctx.scale(size, size);
	ctx.lineJoin = 'miter';

	// 1. Body paths (fg)
	setInk(ctx, fg);
	drawBody(ctx, family, rotation, half);

	// 2. Carve the always-bg corners
	setInk(ctx, bg);
	for (const [cx, cy] of [
		[0, 0],
		[1, 0],
		[1, 1],
		[0, 1]
	] as const) {
		fillQuarterDisc(ctx, cx, cy, cornerR);
	}

	// 3. Edge-midpoint dots (fg)
	setInk(ctx, fg);
	fillDisc(ctx, 0.5, 0.0, edgeDotR);
	fillDisc(ctx, 1.0, 0.5, edgeDotR);
	fillDisc(ctx, 0.5, 1.0, edgeDotR);
	fillDisc(ctx, 0.0, 0.5, edgeDotR);

	ctx.restore(); // also resets globalCompositeOperation
}

function drawBody(ctx: Ctx2D, family: FamilyKey, rotation: number, half: number): void {
	const T1 = 0.5 - half;
	const T2 = 0.5 + half;
	switch (family) {
		case 'plus':
			fillPlusCross(ctx, T1, T2);
			break;
		case 'plusDot':
			// Only the universal edge dots + this centre dot render.
			fillDisc(ctx, 0.5, 0.5, half);
			break;
		case 'xDot':
			// Full square; corner discs carve concave lobes.
			ctx.fillRect(0, 0, 1, 1);
			break;
		case 'diagonal':
			if (rotation === 0) {
				fillFrownBand(ctx, 0, 0, half);
				fillFrownBand(ctx, 1, 1, half);
			} else {
				fillFrownBand(ctx, 1, 0, half);
				fillFrownBand(ctx, 0, 1, half);
			}
			break;
		case 'straight':
			if (rotation === 0) ctx.fillRect(0, T1, 1, T2 - T1);
			else ctx.fillRect(T1, 0, T2 - T1, 1);
			break;
		case 'frown': {
			// 0=NE, 1=NW, 2=SW, 3=SE
			const corners = [
				[1, 0],
				[0, 0],
				[0, 1],
				[1, 1]
			] as const;
			const [cx, cy] = corners[rotation % 4];
			fillFrownBand(ctx, cx, cy, half);
			break;
		}
		case 't':
			fillT(ctx, rotation, T1, T2);
			break;
	}
}

// Plus: union of N, E, W, S, C cells. Sharp 90° boundary.
function fillPlusCross(ctx: Ctx2D, T1: number, T2: number): void {
	ctx.beginPath();
	ctx.moveTo(T1, 0);
	ctx.lineTo(T2, 0);
	ctx.lineTo(T2, T1);
	ctx.lineTo(1, T1);
	ctx.lineTo(1, T2);
	ctx.lineTo(T2, T2);
	ctx.lineTo(T2, 1);
	ctx.lineTo(T1, 1);
	ctx.lineTo(T1, T2);
	ctx.lineTo(0, T2);
	ctx.lineTo(0, T1);
	ctx.lineTo(T1, T1);
	ctx.closePath();
	ctx.fill();
}

// T: arms reach 3 of 4 edges; rotation 0=N (excludes S), 1=E, 2=S, 3=W.
// Inner corners are rounded so they bulge into the adjacent bg corner cell.
function fillT(ctx: Ctx2D, rotation: number, T1: number, T2: number): void {
	const r = (T2 - T1) / 2; // inner-corner round radius (== half bar width)
	ctx.save();
	ctx.translate(0.5, 0.5);
	ctx.rotate((rotation * Math.PI) / 2);
	ctx.translate(-0.5, -0.5);
	// After rotation, the excluded edge is south; arms reach N, E, W.
	ctx.beginPath();
	ctx.moveTo(T1, 0);
	ctx.lineTo(T2, 0);
	ctx.lineTo(T2, T1 - r);
	ctx.arcTo(T2 + r, T1 - r, T2 + r, T1, r);
	ctx.lineTo(T2 + r, T1);
	ctx.lineTo(1, T1);
	ctx.lineTo(1, T2);
	ctx.lineTo(0, T2);
	ctx.lineTo(0, T1);
	ctx.lineTo(T1 - r, T1);
	ctx.arcTo(T1 - r, T1 - r, T1, T1 - r, r);
	ctx.lineTo(T1, T1 - r);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

// Annular sector at corner (cx, cy): inner radius 0.5−half, outer 0.5+half.
function fillFrownBand(ctx: Ctx2D, cx: number, cy: number, half: number): void {
	const rIn = 0.5 - half;
	const rOut = 0.5 + half;
	const [a0, a1] = pickFrownAngles(cx, cy);
	ctx.beginPath();
	ctx.arc(cx, cy, rOut, a0, a1, false);
	ctx.arc(cx, cy, rIn, a1, a0, true);
	ctx.closePath();
	ctx.fill();
}

function pickFrownAngles(cx: number, cy: number): [number, number] {
	// Each corner's interior quadrant in canvas coords (y-down):
	//  (0,0) NW: 0 → π/2     (1,0) NE: π/2 → π
	//  (1,1) SE: π → 3π/2    (0,1) SW: 3π/2 → 2π
	if (cx === 0 && cy === 0) return [0, Math.PI / 2];
	if (cx === 1 && cy === 0) return [Math.PI / 2, Math.PI];
	if (cx === 1 && cy === 1) return [Math.PI, 1.5 * Math.PI];
	return [1.5 * Math.PI, 2 * Math.PI];
}

function fillQuarterDisc(ctx: Ctx2D, cx: number, cy: number, r: number): void {
	const [a0, a1] = pickFrownAngles(cx, cy);
	ctx.beginPath();
	ctx.moveTo(cx, cy);
	ctx.arc(cx, cy, r, a0, a1, false);
	ctx.closePath();
	ctx.fill();
}

function fillDisc(ctx: Ctx2D, cx: number, cy: number, r: number): void {
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.fill();
}
