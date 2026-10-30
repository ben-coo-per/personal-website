// The Octopus, ported from WorldOctopus.dc.html: a raymarched signed-distance-field
// model (ellipsoid head, 8 tentacles of tapered capsule chains smooth-unioned onto
// it, two slit-pupil eyes), lit with Lambert + rim + a little specular and rendered
// down to dots, r = cell/2 * min(1.05, sqrt(b)). It animates at 12 fps on purpose.
//
// Copied from inker-studio/src/lib/ink/octopus.ts. Keep the model in step with it.
//
// Changes from the board, for the studio:
// - Pure: `octopusDots(params, t)` returns the dots instead of drawing them, so the
//   frame for a given time is deterministic and can be exported at any scale.
// - The board's fixed 1088x640 canvas, centre (544, 330) and scale 175 are
//   parameters (box, centre as a fraction of the box, scale in px per unit).
// - `phase` shifts the slow yaw sway; `look` is the eye target the board eased
//   toward the cursor, given directly.
// - Time is quantised with `frameTime` (floor to 1/12 s) where the board rendered
//   whenever 1/12 s of wall time had passed.
//
// Changes for bencooper.xyz:
// - `yaw` and `pitch` turn the whole body on top of the sway, and `start` eases them
//   toward the cursor, so the octopus faces it rather than only glancing at it.
import { watchCursor } from './eyemanager';
import { n3, type Vec3 } from './inkgrid';
import { animate, fitCanvas, PAPER, type Stop } from './runtime';

export const TN = 8;
export const SEG = 8;
export const EYE: Vec3[] = [
	[-0.25, -0.4, -0.5],
	[0.25, -0.4, -0.5]
];
export const FPS = 12;

/** Time of the 12 fps frame showing at time t. */
export function frameTime(t: number, fps = FPS): number {
	return Math.floor(t * fps + 1e-9) / fps;
}

/** The board's blend of head distance a and tentacle distance b. */
export function smin(a: number, b: number): number {
	const hh = Math.max(0.14 - Math.abs(a - b), 0) / 0.14;
	return Math.min(a, b) - hh * hh * 0.035;
}

/** Ellipsoid head, radii (0.62, 0.74, 0.6), centred at (0, -0.55, 0). */
export function headSdf(x: number, y: number, z: number): number {
	const hx = x / 0.62;
	const hy = (y + 0.55) / 0.74;
	const hz = z / 0.6;
	const k0 = Math.sqrt(hx * hx + hy * hy + hz * hz);
	const k1 = Math.sqrt((hx * hx) / 0.3844 + (hy * hy) / 0.5476 + (hz * hz) / 0.36);
	return (k0 * (k0 - 1)) / k1;
}

export function tentacleRadius(k: number): number {
	return 0.16 * (1 - k / (SEG + 1.5)) + 0.02;
}

export interface Tentacle {
	pts: Float32Array;
	rad: Float32Array;
	bc: Vec3;
	br: number;
}

/** True when chain `o` cannot be nearer than the current distance d (plus the blend reach). */
export function skipTentacle(x: number, y: number, z: number, o: { bc: Vec3; br: number }, d: number): boolean {
	const bx = x - o.bc[0];
	const by = y - o.bc[1];
	const bz = z - o.bc[2];
	return Math.sqrt(bx * bx + by * by + bz * bz) - o.br > d + 0.15;
}

export interface Hit {
	/** 1 skin, 2 eye */
	m: number;
	e: number;
}

export interface Model {
	tp: Tentacle[];
	build(T: number): void;
	sdf(x: number, y: number, z: number, out?: Hit | null): number;
}

export function createModel(): Model {
	const tp: Tentacle[] = [];
	for (let i = 0; i < TN; i++)
		tp.push({ pts: new Float32Array((SEG + 1) * 3), rad: new Float32Array(SEG + 1), bc: [0, 0, 0], br: 0 });

	function build(T: number) {
		for (let i = 0; i < TN; i++) {
			const a = (i / TN) * 6.2832 + 0.2 + 0.12 * Math.sin(T * 0.7 + i * 1.3);
			const ux = Math.cos(a);
			const uz = Math.sin(a);
			let th = 1.25;
			let px = ux * 0.32;
			let py = 0;
			let pz = uz * 0.32;
			const o = tp[i];
			for (let k = 0; k <= SEG; k++) {
				o.pts[k * 3] = px;
				o.pts[k * 3 + 1] = py;
				o.pts[k * 3 + 2] = pz;
				o.rad[k] = tentacleRadius(k);
				th += -(0.06 + (0.42 * k) / SEG) * (1 + 0.3 * Math.sin(T * 1.4 + i * 1.9));
				const cs = Math.cos(th);
				const sn = Math.sin(th);
				const len = 0.21;
				px += ux * cs * len;
				pz += uz * cs * len;
				py += sn * len;
			}
			let mx = 0;
			let my = 0;
			let mz = 0;
			for (let k = 0; k <= SEG; k++) {
				mx += o.pts[k * 3];
				my += o.pts[k * 3 + 1];
				mz += o.pts[k * 3 + 2];
			}
			mx /= SEG + 1;
			my /= SEG + 1;
			mz /= SEG + 1;
			let br = 0;
			for (let k = 0; k <= SEG; k++)
				br = Math.max(br, Math.hypot(o.pts[k * 3] - mx, o.pts[k * 3 + 1] - my, o.pts[k * 3 + 2] - mz) + o.rad[k]);
			o.bc = [mx, my, mz];
			o.br = br;
		}
	}

	function sdf(x: number, y: number, z: number, out?: Hit | null): number {
		let d = headSdf(x, y, z);
		for (let i = 0; i < TN; i++) {
			const o = tp[i];
			if (skipTentacle(x, y, z, o, d)) continue;
			let dm = 1e9;
			for (let k = 0; k < SEG; k++) {
				const ax = o.pts[k * 3];
				const ay = o.pts[k * 3 + 1];
				const az = o.pts[k * 3 + 2];
				const vx = o.pts[k * 3 + 3] - ax;
				const vy = o.pts[k * 3 + 4] - ay;
				const vz = o.pts[k * 3 + 5] - az;
				const qx = x - ax;
				const qy = y - ay;
				const qz = z - az;
				let h = (qx * vx + qy * vy + qz * vz) / (vx * vx + vy * vy + vz * vz);
				h = h < 0 ? 0 : h > 1 ? 1 : h;
				const ex = qx - vx * h;
				const ey = qy - vy * h;
				const ez = qz - vz * h;
				const dc = Math.sqrt(ex * ex + ey * ey + ez * ez) - (o.rad[k] + (o.rad[k + 1] - o.rad[k]) * h);
				if (dc < dm) dm = dc;
			}
			d = smin(d, dm);
		}
		let de = 1e9;
		let ei = -1;
		for (let e = 0; e < 2; e++) {
			const E = EYE[e];
			const q = Math.hypot(x - E[0], y - E[1], z - E[2]) - 0.12;
			if (q < de) {
				de = q;
				ei = e;
			}
		}
		if (out) {
			out.m = de < d ? 2 : 1;
			out.e = ei;
		}
		return Math.min(d, de);
	}

	return { tp, build, sdf };
}

type M3 = number[];
function rx(a: number): M3 {
	const c = Math.cos(a);
	const s = Math.sin(a);
	return [1, 0, 0, 0, c, -s, 0, s, c];
}
function ry(a: number): M3 {
	const c = Math.cos(a);
	const s = Math.sin(a);
	return [c, 0, s, 0, 1, 0, -s, 0, c];
}
function mm(A: M3, B: M3): M3 {
	const R = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	for (let i = 0; i < 3; i++)
		for (let j = 0; j < 3; j++) R[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
	return R;
}
function tr(A: M3): M3 {
	return [A[0], A[3], A[6], A[1], A[4], A[7], A[2], A[5], A[8]];
}

/** The view rotation: tilted 0.45 rad, swaying in yaw by 0.35 sin(0.25 T + phase). */
export function rotation(T: number, phase = 0, yaw = 0, pitch = 0): M3 {
	return tr(mm(rx(0.45 + pitch), ry(0.35 * Math.sin(T * 0.25 + phase) + yaw)));
}

/** Entry and exit distances of a ray through the bounding sphere (r 2, centre y -0.1). */
export function rayBound(o: Vec3, D: Vec3): [number, number] | null {
	const ox = o[0];
	const oy = o[1] + 0.1;
	const oz = o[2];
	const bb = ox * D[0] + oy * D[1] + oz * D[2];
	const cc = ox * ox + oy * oy + oz * oz - 4.0;
	const disc = bb * bb - cc;
	if (disc <= 0) return null;
	const sq = Math.sqrt(disc);
	return [Math.max(0, -bb - sq), -bb + sq];
}

export interface OctopusParams {
	/** Box in px. */
	w: number;
	h: number;
	cell: number;
	/** Pixels per model unit (the board uses 175). */
	scale: number;
	/** Model origin as a fraction of the box (the board: 0.5, 330/640). */
	cx: number;
	cy: number;
	/** Shifts the yaw sway, radians. */
	phase: number;
	/** Where the eyes look, -1..1 each way. */
	look: [number, number];
	/** Extra turn on top of the sway, radians. */
	yaw?: number;
	pitch?: number;
}

export const DEFAULT_OCTOPUS: OctopusParams = {
	w: 1088,
	h: 640,
	cell: 11,
	scale: 175,
	cx: 0.5,
	cy: 330 / 640,
	phase: 0,
	look: [0, 0]
};

/**
 * The dots for the frame showing at time t (quantised to 12 fps), as x, y, r
 * triples in box px.
 */
export function octopusDots(p: OctopusParams, t: number, model = createModel()): Float32Array {
	const T = frameTime(t);
	const C = p.cell;
	const GW = Math.floor(p.w / C);
	const GH = Math.floor(p.h / C);
	const cx0 = p.w * p.cx;
	const cy0 = p.h * p.cy;
	const S = p.scale;
	model.build(T);
	const M = rotation(T, p.phase, p.yaw, p.pitch);
	const mul = (v: Vec3): Vec3 => [
		M[0] * v[0] + M[1] * v[1] + M[2] * v[2],
		M[3] * v[0] + M[4] * v[1] + M[5] * v[2],
		M[6] * v[0] + M[7] * v[1] + M[8] * v[2]
	];
	const L = mul(n3(-0.5, -0.65, -0.6));
	const V = mul([0, 0, -1]);
	const Hh = n3(L[0] + V[0], L[1] + V[1], L[2] + V[2]);
	const D = mul([0, 0, 1]);
	const out: Hit = { m: 0, e: -1 };
	const half = C / 2;
	const dots: number[] = [];
	const sdf = model.sdf;
	for (let j = 0; j < GH; j++)
		for (let i = 0; i < GW; i++) {
			const X = ((i + 0.5) * C - cx0) / S;
			const Y = ((j + 0.5) * C - cy0) / S;
			const o = mul([X, Y, -4]);
			const bound = rayBound(o, D);
			if (!bound) continue;
			let [tt] = bound;
			const t1 = bound[1];
			let hit = false;
			let px = 0;
			let py = 0;
			let pz = 0;
			for (let s = 0; s < 56 && tt < t1; s++) {
				px = o[0] + D[0] * tt;
				py = o[1] + D[1] * tt;
				pz = o[2] + D[2] * tt;
				const dd = sdf(px, py, pz, null);
				if (dd < 0.004) {
					hit = true;
					break;
				}
				tt += dd * 0.9;
			}
			if (!hit) continue;
			sdf(px, py, pz, out);
			const e = 0.005;
			const a = sdf(px + e, py - e, pz - e);
			const b2 = sdf(px - e, py - e, pz + e);
			const c = sdf(px - e, py + e, pz - e);
			const d3 = sdf(px + e, py + e, pz + e);
			let nx = a - b2 - c + d3;
			let ny = -a - b2 + c + d3;
			let nz = -a + b2 - c + d3;
			const nl = Math.hypot(nx, ny, nz) || 1;
			nx /= nl;
			ny /= nl;
			nz /= nl;
			const lam = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
			const nv = Math.max(0, nx * V[0] + ny * V[1] + nz * V[2]);
			const rim = Math.pow(1 - nv, 3);
			const sp = Math.pow(Math.max(0, nx * Hh[0] + ny * Hh[1] + nz * Hh[2]), 36);
			let b: number;
			if (out.m === 2) {
				const E = EYE[out.e];
				const qx = px - E[0] - p.look[0] * 0.04;
				const qy = py - E[1] - p.look[1] * 0.03;
				const qz = pz - E[2];
				b = 0.25 + 0.75 * lam;
				if (qz < -0.06 && Math.abs(qy) < 0.028 && Math.abs(qx) < 0.075) b = 0.02;
				b += sp * 0.35;
			} else {
				const tex = 0.88 + 0.12 * Math.sin(px * 23 + Math.sin(pz * 17)) * Math.sin(py * 19);
				b = (0.05 + 0.75 * lam) * tex + 0.14 * rim + sp * 0.08;
			}
			if (b > 0.015) dots.push((i + 0.5) * C, (j + 0.5) * C, half * Math.min(1.05, Math.sqrt(b)));
		}
	return new Float32Array(dots);
}

/** Grid columns across the box; the board's density of about 0.063 units per cell. */
const COLS = 70;
/** How far the body turns toward a cursor at the edge of the screen, radians. */
const MAX_YAW = 0.6;
const MAX_PITCH = 0.3;
/** Easing rate of the turn, per second: it should lag the cursor, like something heavy. */
const EASE = 3.5;

export interface LiveOptions {
	/** Pixels per unit, as a fraction of the box height (the board: 0.27). */
	fit?: number;
	/** Model origin as a fraction of the box. */
	cx?: number;
	cy?: number;
	/** Called after the first frame is on the canvas. */
	onReady?: () => void;
}

/** Draw the octopus on `el`, at 12 fps, turning to face the page cursor. */
export function start(el: HTMLCanvasElement, o: LiveOptions = {}): Stop {
	const { cursor, release } = watchCursor();
	const model = createModel();
	let ctx: CanvasRenderingContext2D;
	let w = 0;
	let h = 0;
	let drawn = -1;
	let yaw = 0;
	let pitch = 0;
	let lookX = 0;
	let lookY = 0;
	const frame = (dt: number, t: number) => {
		const box = el.getBoundingClientRect();
		// Relative to the page, not the canvas, so a small card still turns all the way.
		const dx = cursor.x == null ? 0 : (cursor.x - (box.left + box.width / 2)) / (innerWidth / 2);
		const dy = cursor.x == null ? 0 : (cursor.y - (box.top + box.height / 2)) / (innerHeight / 2);
		const tx = Math.max(-1, Math.min(1, dx));
		const ty = Math.max(-1, Math.min(1, dy));
		const k = 1 - Math.exp(-EASE * dt);
		yaw += (-tx * MAX_YAW - yaw) * k; // +yaw turns the face to screen left
		pitch += (ty * MAX_PITCH - pitch) * k;
		lookX += (tx - lookX) * k;
		lookY += (ty - lookY) * k;
		const T = frameTime(t);
		if (T === drawn) return;
		drawn = T;
		const dots = octopusDots(
			{
				w,
				h,
				cell: w / COLS,
				scale: h * (o.fit ?? 0.27),
				cx: o.cx ?? 0.5,
				cy: o.cy ?? 330 / 640,
				phase: 0,
				look: [lookX, lookY],
				yaw,
				pitch
			},
			t,
			model
		);
		ctx.clearRect(0, 0, w, h);
		ctx.beginPath();
		for (let i = 0; i < dots.length; i += 3) {
			ctx.moveTo(dots[i] + dots[i + 2], dots[i + 1]);
			ctx.arc(dots[i], dots[i + 1], dots[i + 2], 0, 6.2832);
		}
		ctx.fillStyle = PAPER;
		ctx.fill();
		o.onReady?.();
		o.onReady = undefined;
	};
	const stop = animate(el, frame, {
		still: 0,
		onResize: () => {
			const box = el.getBoundingClientRect();
			w = box.width;
			h = box.height;
			ctx = fitCanvas(el, w, h);
			drawn = -1;
		}
	});
	return () => {
		stop();
		release();
	};
}
