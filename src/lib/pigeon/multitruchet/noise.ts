/**
 * Value-noise field used for the optional "topo" background mode, where the
 * line weight of background-region tiles is nudged up/down by a banded noise
 * field so some areas read denser than others.
 *
 * Ported from ../../../../multitruchet-text/src/topo.js. Pure math — no DOM.
 */

/** Deterministic, cheap 32-bit hash → [0, 1). */
export function hash(a: number, b: number, c: number, d: number): number {
	let x = (a | 0) ^ Math.imul(b | 0, 0x85ebca6b);
	x ^= Math.imul(c | 0, 0xc2b2ae35);
	x ^= Math.imul(d | 0, 0x27d4eb2f);
	x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
	x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
	x ^= x >>> 16;
	return (x >>> 0) / 4294967296;
}

function lattice(ix: number, iy: number, seed: number): number {
	return hash(ix, iy, seed, 0x9e3779b9) * 2 - 1;
}

export function valueNoise2(x: number, y: number, seed: number): number {
	const ix = Math.floor(x);
	const iy = Math.floor(y);
	const fx = x - ix;
	const fy = y - iy;
	const u = fx * fx * (3 - 2 * fx);
	const v = fy * fy * (3 - 2 * fy);
	const a = lattice(ix, iy, seed);
	const b = lattice(ix + 1, iy, seed);
	const c = lattice(ix, iy + 1, seed);
	const d = lattice(ix + 1, iy + 1, seed);
	const ab = a + (b - a) * u;
	const cd = c + (d - c) * u;
	return ab + (cd - ab) * v;
}

export function fbm2(
	x: number,
	y: number,
	seed: number,
	octaves: number,
	lacunarity = 2.0,
	gain = 0.5
): number {
	let freq = 1;
	let amp = 1;
	let sum = 0;
	let norm = 0;
	for (let i = 0; i < octaves; i++) {
		sum += amp * valueNoise2(x * freq, y * freq, seed + i * 131);
		norm += amp;
		freq *= lacunarity;
		amp *= gain;
	}
	return norm > 0 ? sum / norm : 0;
}

/** Each seed → a stable, well-separated offset on the noise plane. */
export function seedToOffset(seed: number): { ox: number; oy: number } {
	return {
		ox: hash(seed | 0, 0xa5a5a5a5, 1, 0) * 1024,
		oy: hash(seed | 0, 0x5a5a5a5a, 2, 0) * 1024
	};
}

export interface TopoOpts {
	noiseScale: number;
	noiseOctaves: number;
	bands: number;
}

/**
 * Sample the noise field at a tile centre, quantised to one of `bands`
 * discrete levels in [−1, 1]. Quantisation is what makes the result read as
 * "a few denser areas" rather than smooth gradient noise.
 */
export function sampleTopoShade(
	tile: { x: number; y: number; size: number },
	seed: number,
	opts: TopoOpts
): number {
	const { noiseScale, noiseOctaves, bands } = opts;
	const off = seedToOffset(seed);
	const cx = tile.x + tile.size / 2;
	const cy = tile.y + tile.size / 2;
	const scale = noiseScale / 100;
	const n = fbm2((cx + off.ox) * scale, (cy + off.oy) * scale, 0, Math.max(1, noiseOctaves | 0));
	const C = Math.max(2, bands | 0);
	const b = Math.max(0, Math.min(C - 1, Math.floor((n + 1) * 0.5 * C)));
	return (b / (C - 1)) * 2 - 1;
}
