<script lang="ts">
	import { onMount } from 'svelte';

	// Brand mark glyph — 8×8 bitmap, used as the dither dot unit.
	// At STAMP=1 each renders as an 8×8 CSS px diamond ring.
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
	const STAMP = 1; // 1 CSS px per bitmap pixel → 8×8px glyph (small)
	const CELL = 8; // dither grid cell size (px); equals GW×STAMP here
	const TUBE_R = 20; // tube cross-section radius in px
	const MAX_AGE = 80; // frames until a trail point fully dissolves
	const MAX_TRAIL = 55; // max stored points (≈ 440 px of path at MIN_DIST=8)
	const MIN_DIST = 8; // min px between trail points → smooth tube

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

	// Draw one glyph stamp centred at (cx, cy). fillStyle must be set by caller.
	function stamp(cx: number, cy: number): void {
		const ox = Math.round(cx - (GW * STAMP) / 2);
		const oy = Math.round(cy - (GH * STAMP) / 2);
		for (let y = 0; y < GH; y++) {
			for (let x = 0; x < GW; x++) {
				if (GLYPH[y][x]) ctx.fillRect(ox + x * STAMP, oy + y * STAMP, STAMP, STAMP);
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
	 * Shading model: a cylinder viewed from directly above.
	 *   surface normal z-component = sqrt(1 − (d/R)²)
	 * This gives density=1 at the centreline (top of tube faces viewer →
	 * fully lit → all dither cells render → solid highlight) and density=0
	 * at the silhouette edge (side faces away → no cells render → black).
	 *
	 * Age dissolve: effectiveDensity = tubeDensity × ageFade.
	 * As ageFade decreases, outer low-density cells drop out first —
	 * the tube narrows inward rather than uniformly fading.
	 */
	function renderSegment(p0: TrailPoint, p1: TrailPoint): void {
		const segAge = (p0.age + p1.age) / 2;
		const ageFade = Math.pow(1 - segAge / MAX_AGE, 1.6);
		if (ageFade < 0.02) return;

		const x0 = p0.x,
			y0 = p0.y,
			x1 = p1.x,
			y1 = p1.y;
		const minGX = Math.floor((Math.min(x0, x1) - TUBE_R) / CELL);
		const maxGX = Math.ceil((Math.max(x0, x1) + TUBE_R) / CELL);
		const minGY = Math.floor((Math.min(y0, y1) - TUBE_R) / CELL);
		const maxGY = Math.ceil((Math.max(y0, y1) + TUBE_R) / CELL);

		// Fixed amber — shading is handled purely by which cells render (Bayer),
		// not by per-glyph alpha. This is authentic ordered dithering.
		ctx.fillStyle = 'rgba(251,191,36,0.15)';

		for (let gy = minGY; gy <= maxGY; gy++) {
			for (let gx = minGX; gx <= maxGX; gx++) {
				// Cell centre in world coordinates (Bayer grid is canvas-absolute)
				const wx = (gx + 0.5) * CELL;
				const wy = (gy + 0.5) * CELL;

				const d = distToSegment(wx, wy, x0, y0, x1, y1);
				if (d >= TUBE_R) continue;

				// Cylinder cross-section density (bright top → sparse edge)
				const t = d / TUBE_R;
				const tubeDensity = Math.sqrt(1 - t * t);

				// Multiply by age factor so old segments narrow rather than grey out
				const effectiveDensity = tubeDensity * ageFade;

				const bx = ((gx % 4) + 4) % 4;
				const by = ((gy % 4) + 4) % 4;
				if (BAYER[by][bx] >= effectiveDensity) continue;

				stamp(wx, wy);
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
		trail = trail.filter((p) => p.age < MAX_AGE);

		// Render from oldest to newest so fresh segments read on top
		for (let i = 0; i < trail.length - 1; i++) {
			renderSegment(trail[i], trail[i + 1]);
		}

		for (const p of trail) p.age++;
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
