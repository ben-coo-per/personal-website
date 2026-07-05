<script lang="ts">
	import { onMount } from 'svelte';

	// ── The system ────────────────────────────────────────────────────────────
	// The cursor drags a dithered tube across the page: a cylinder shaded by a
	// 4×4 Bayer matrix, drawn in 8×8 brand-glyph stamps. The tube is treated as
	// signal being *remembered*, and memory here decays by fixed rules — every
	// distortion is a pure hash of (cell, clock tick), so the corruption is
	// mechanical and replayable, never random shimmer:
	//
	//   1. EROSION — a coarse value-noise field, re-seeded only on a ~7.5 Hz
	//      clock tick, eats into the tube's silhouette. Fresh segments are
	//      barely touched; old ones are chewed apart before they dissolve.
	//   2. ROW TEAR — on a slower clock, a hash picks whole grid rows and
	//      shears them sideways by exact cell multiples, slicing the tube
	//      like a dropped scanline.
	//   3. BIT-ROT — each stamped glyph loses individual pixels with a
	//      probability equal to its local corruption; edge cells and old
	//      cells render as crumbling glyph fragments rather than fading.
	//   4. STUCK CELLS — a rare hash latches a cell, which then renders a
	//      *perfect* glyph in faint amber. The only pristine glyphs in the
	//      field are the errors.
	//
	// Everything is tone-on-tone: the tube is drawn in the site's own surface
	// blacks (--bg-2 #111114, --bg-3 #17171c, plus one step brighter for the
	// fresh core) over the #0a0a0b page, so it reads as a disturbance in the
	// black — texture, not graphic. Amber appears only as stuck-cell noise.

	// Brand mark glyph — 8×8 bitmap, used as the dither dot unit.
	const GLYPH: number[][] = [
		[0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 1, 1, 0, 0, 0],
		[0, 0, 1, 1, 1, 1, 0, 0],
		[0, 1, 1, 0, 0, 1, 1, 0],
		[0, 1, 1, 0, 0, 1, 1, 0],
		[0, 0, 1, 1, 1, 1, 0, 0],
		[0, 0, 0, 1, 1, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0]
	];
	const GW = 8,
		GH = 8;

	// 4×4 Bayer ordered dither matrix, values in [0, 1)
	const BAYER: number[][] = [
		[0 / 16, 8 / 16, 2 / 16, 10 / 16],
		[12 / 16, 4 / 16, 14 / 16, 6 / 16],
		[3 / 16, 11 / 16, 1 / 16, 9 / 16],
		[15 / 16, 7 / 16, 13 / 16, 5 / 16]
	];

	// ── Tube parameters ───────────────────────────────────────────────────────
	const STAMP = 1; // 1 CSS px per bitmap pixel → 8×8px glyph
	const CELL = 8; // dither grid cell size (px); equals GW×STAMP here
	const TUBE_R = 22; // tube cross-section radius in px
	const MAX_AGE = 90; // frames until a trail point fully dissolves
	const MAX_TRAIL = 55; // max stored points
	const MIN_DIST = 8; // min px between trail points → smooth tube

	// ── Corruption parameters ─────────────────────────────────────────────────
	const NOISE_TICK = 8; // frames per erosion-field re-seed (~7.5 Hz)
	const TEAR_TICK = 14; // frames per row-tear re-roll
	const LAT = 3; // erosion lattice spacing, in grid cells
	const EROSION = 9; // max px the noise field can bite from the silhouette
	const TEAR_PROB = 0.12; // fraction of rows sheared per tear tick
	const STUCK_PROB = 0.03; // fraction of cells latched amber per slow tick

	// Tone-on-tone palette: surface blacks over the #0a0a0b page.
	const COL_EDGE = '#111114'; // --bg-2
	const COL_CORE = '#17171c'; // --bg-3
	const COL_FRESH = '#1e1e25'; // one step brighter, fresh-core only
	const COL_STUCK = 'rgba(251, 191, 36, 0.12)'; // faint amber, stuck cells

	interface TrailPoint {
		x: number;
		y: number;
		age: number;
	}

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let trail: TrailPoint[] = [];
	let lastX: number | null = null;
	let lastY: number | null = null;
	let rafId: number;
	let frameCount = 0;
	let curFill = '';

	// Deterministic integer hash → [0, 1). Same inputs, same corruption.
	function hash3(x: number, y: number, z: number): number {
		let h =
			Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1440662683);
		h = Math.imul(h ^ (h >>> 13), 1274126177);
		h ^= h >>> 16;
		return (h >>> 0) / 4294967296;
	}

	// Bilinear value noise over a coarse lattice of the dither grid — coherent
	// bites of corruption rather than per-cell static. Re-seeds per tick only.
	function fieldNoise(gx: number, gy: number, tick: number): number {
		const fx = gx / LAT,
			fy = gy / LAT;
		const x0 = Math.floor(fx),
			y0 = Math.floor(fy);
		const tx = fx - x0,
			ty = fy - y0;
		const a = hash3(x0, y0, tick);
		const b = hash3(x0 + 1, y0, tick);
		const c = hash3(x0, y0 + 1, tick);
		const d = hash3(x0 + 1, y0 + 1, tick);
		return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
	}

	// Whole-row shear in exact cell multiples; deterministic per (row, tick).
	function rowShift(gy: number, tick: number): number {
		if (hash3(gy, 977, tick) >= TEAR_PROB) return 0;
		const r = hash3(gy, 1409, tick);
		return (r < 0.5 ? -1 : 1) * (1 + (Math.floor(r * 4) % 2));
	}

	function setFill(c: string): void {
		if (c !== curFill) {
			ctx.fillStyle = c;
			curFill = c;
		}
	}

	// Stamp one glyph centred at (cx, cy). `rot` ∈ [0, 1] knocks out individual
	// glyph pixels via a per-pixel hash — the glyph crumbles instead of fading.
	function stamp(cx: number, cy: number, rot: number, key: number, tick: number): void {
		const ox = Math.round(cx - (GW * STAMP) / 2);
		const oy = Math.round(cy - (GH * STAMP) / 2);
		for (let y = 0; y < GH; y++) {
			for (let x = 0; x < GW; x++) {
				if (!GLYPH[y][x]) continue;
				if (rot > 0 && hash3(key, y * GW + x, tick) < rot) continue;
				ctx.fillRect(ox + x * STAMP, oy + y * STAMP, STAMP, STAMP);
			}
		}
	}

	// Shortest distance from point (px,py) to line segment (ax,ay)→(bx,by).
	function distToSegment(
		px: number,
		py: number,
		ax: number,
		ay: number,
		bx: number,
		by: number
	): number {
		const dx = bx - ax,
			dy = by - ay;
		const len2 = dx * dx + dy * dy;
		if (len2 < 1) return Math.hypot(px - ax, py - ay);
		const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
		return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
	}

	/**
	 * Render one tube segment between p0 and p1.
	 *
	 * Shading model: a cylinder viewed from above —
	 *   density = sqrt(1 − (d/R)²) × ageFade
	 * with d first displaced by the row tear (a sheared row samples the tube
	 * at a shifted x, so it moves as a unit) and then pushed in/out by the
	 * erosion field, biting deeper as the segment decays. Ordered dithering
	 * does the rest: cells whose Bayer threshold exceeds the density simply
	 * don't render.
	 */
	function renderSegment(
		p0: TrailPoint,
		p1: TrailPoint,
		noiseTick: number,
		tearTick: number
	): void {
		const segAge = (p0.age + p1.age) / 2;
		const ageFade = Math.pow(1 - segAge / MAX_AGE, 1.6);
		if (ageFade < 0.02) return;

		// Corruption climbs as the segment ages — fresh signal is clean,
		// remembered signal rots.
		const decay = 1 - ageFade;
		const bite = EROSION * (0.4 + 0.6 * decay);

		const x0 = p0.x,
			y0 = p0.y,
			x1 = p1.x,
			y1 = p1.y;
		const pad = TUBE_R + EROSION + 2 * CELL; // room for erosion + row tear
		const minGX = Math.floor((Math.min(x0, x1) - pad) / CELL);
		const maxGX = Math.ceil((Math.max(x0, x1) + pad) / CELL);
		const minGY = Math.floor((Math.min(y0, y1) - pad) / CELL);
		const maxGY = Math.ceil((Math.max(y0, y1) + pad) / CELL);

		for (let gy = minGY; gy <= maxGY; gy++) {
			const shear = rowShift(gy, tearTick) * CELL;
			for (let gx = minGX; gx <= maxGX; gx++) {
				// Cell centre in world coordinates (Bayer grid is canvas-absolute)
				const wx = (gx + 0.5) * CELL;
				const wy = (gy + 0.5) * CELL;

				const d = distToSegment(wx - shear, wy, x0, y0, x1, y1);
				if (d >= TUBE_R + EROSION) continue;

				// Erosion: the noise field pushes the silhouette in and out
				const n = fieldNoise(gx, gy, noiseTick);
				const de = d + (n - 0.35) * bite;
				if (de >= TUBE_R) continue;

				const t = Math.max(de, 0) / TUBE_R;
				const tubeDensity = Math.sqrt(1 - t * t);
				const effectiveDensity = tubeDensity * ageFade;

				const bx = ((gx % 4) + 4) % 4;
				const by = ((gy % 4) + 4) % 4;
				if (BAYER[by][bx] >= effectiveDensity) continue;

				// Stuck cell: latched on a slow clock, renders the only pristine
				// glyph in the field — in amber
				if (hash3(gx, gy, noiseTick >> 2) < STUCK_PROB) {
					setFill(COL_STUCK);
					stamp(wx, wy, 0, 0, 0);
					continue;
				}

				// Bit-rot: edge cells and old cells crumble pixel by pixel
				const rot = Math.min(0.85, t * 0.7 + decay * 0.55 + (n - 0.5) * 0.3);
				setFill(t < 0.4 ? (segAge < 14 ? COL_FRESH : COL_CORE) : COL_EDGE);
				stamp(wx, wy, Math.max(0, rot), gx * 31 + gy * 517, noiseTick);
			}
		}
	}

	function addPoint(mx: number, my: number): void {
		if (lastX === null || Math.hypot(mx - lastX, my - lastY!) >= MIN_DIST) {
			trail.push({ x: mx, y: my, age: 0 });
			if (trail.length > MAX_TRAIL) trail.shift();
			lastX = mx;
			lastY = my;
		}
	}

	function onMouseMove(e: MouseEvent): void {
		addPoint(e.clientX, e.clientY);
	}
	function onTouchMove(e: TouchEvent): void {
		const t = e.touches[0];
		if (t) addPoint(t.clientX, t.clientY);
	}

	function resize(): void {
		if (!canvas) return;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	function frame(): void {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		curFill = '';
		trail = trail.filter((p) => p.age < MAX_AGE);

		const noiseTick = Math.floor(frameCount / NOISE_TICK);
		const tearTick = Math.floor(frameCount / TEAR_TICK);

		// Render from oldest to newest so fresh segments read on top
		for (let i = 0; i < trail.length - 1; i++) {
			renderSegment(trail[i], trail[i + 1], noiseTick, tearTick);
		}

		for (const p of trail) p.age++;
		frameCount++;
		rafId = requestAnimationFrame(frame);
	}

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		resize();
		window.addEventListener('mousemove', onMouseMove, { passive: true });
		window.addEventListener('touchmove', onTouchMove, { passive: true });
		window.addEventListener('resize', resize);
		rafId = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('resize', resize);
		};
	});
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}
</style>
