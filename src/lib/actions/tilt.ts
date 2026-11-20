/**
 * Cursor-driven 3D tilt. The side under the cursor sinks away from the viewer, as if
 * pressed with a finger. The parent must supply `perspective`. A rAF loop lerps the
 * current angle toward the target each frame (weighted, not locked to the mouse), and
 * the inline transform is cleared once the element settles flat so text stays crisp.
 * Off on coarse/hover-less pointers and under prefers-reduced-motion.
 */
export interface TiltOptions {
	/** Max tilt in degrees at the card's edges. */
	max?: number;
	/** Fraction of the remaining distance covered per frame (0–1). */
	ease?: number;
}

const REST = 0.01; // degrees; below this the card counts as flat

export function tilt(node: HTMLElement, opts: TiltOptions = {}) {
	if (typeof window === 'undefined' || !window.matchMedia) return {};

	let max = opts.max ?? 7;
	let ease = opts.ease ?? 0.12;

	const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	let enabled = finePointer.matches && !reducedMotion.matches;

	let curX = 0;
	let curY = 0;
	let targetX = 0;
	let targetY = 0;
	let frame = 0;

	function step() {
		curX += (targetX - curX) * ease;
		curY += (targetY - curY) * ease;

		const arrived = Math.abs(targetX - curX) < REST && Math.abs(targetY - curY) < REST;
		if (arrived && Math.abs(targetX) < REST && Math.abs(targetY) < REST) {
			reset(); // flat: drop the transform entirely
			return;
		}
		if (arrived) {
			curX = targetX;
			curY = targetY;
		}

		node.style.transform = `rotateX(${curX.toFixed(3)}deg) rotateY(${curY.toFixed(3)}deg)`;
		// Idle while the cursor rests; the next pointermove restarts the loop.
		frame = arrived ? 0 : requestAnimationFrame(step);
	}

	function start() {
		if (!frame) frame = requestAnimationFrame(step);
	}

	function reset() {
		if (frame) cancelAnimationFrame(frame);
		frame = 0;
		curX = curY = targetX = targetY = 0;
		node.style.transform = '';
	}

	function onMove(e: PointerEvent) {
		if (!enabled || e.pointerType !== 'mouse') return;
		const r = node.getBoundingClientRect();
		if (!r.width || !r.height) return;
		const nx = ((e.clientX - r.left) / r.width) * 2 - 1; // -1 left … 1 right
		const ny = ((e.clientY - r.top) / r.height) * 2 - 1; // -1 top … 1 bottom
		const clamp = (v: number) => Math.max(-1, Math.min(1, v));
		// CSS axes (y down, z toward viewer): rotateY(+) pushes the right edge away,
		// rotateX(+) pushes the top edge away. So the edge under the cursor recedes.
		targetY = clamp(nx) * max;
		targetX = -clamp(ny) * max;
		start();
	}

	function onLeave() {
		if (!enabled) return;
		targetX = targetY = 0;
		start();
	}

	function onMediaChange() {
		enabled = finePointer.matches && !reducedMotion.matches;
		if (!enabled) reset();
	}

	node.addEventListener('pointermove', onMove);
	node.addEventListener('pointerleave', onLeave);
	finePointer.addEventListener('change', onMediaChange);
	reducedMotion.addEventListener('change', onMediaChange);

	return {
		update(next: TiltOptions = {}) {
			max = next.max ?? 7;
			ease = next.ease ?? 0.12;
		},
		destroy() {
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerleave', onLeave);
			finePointer.removeEventListener('change', onMediaChange);
			reducedMotion.removeEventListener('change', onMediaChange);
			reset();
		}
	};
}
