/** Scroll helpers for the PIGEON page's scroll-driven beats. */

export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const smooth = (t: number) => {
	const x = clamp01(t);
	return x * x * (3 - 2 * x);
};
/** Map p from [a, b] onto [0, 1], clamped. */
export const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/**
 * Reports how far the page has scrolled through `node`, in [0, 1].
 * - `through` (default): 0 when the node's top reaches the viewport top, 1 when its
 *   bottom reaches the viewport bottom. Use on a tall section with a sticky child.
 * - `enter`: 0 when the node's top enters at the bottom of the viewport, 1 when its
 *   centre reaches the viewport centre.
 * - `cover`: 0 when the node's top enters at the bottom of the viewport, 1 when its
 *   bottom reaches the viewport bottom. Use on a sticky section that should start
 *   playing as it scrolls in, not only once it is pinned.
 */
export function progress(
	node: HTMLElement,
	opts: { onchange: (p: number) => void; mode?: 'through' | 'enter' | 'cover' }
) {
	let raf = 0;
	let last = -1;
	const measure = () => {
		raf = 0;
		const r = node.getBoundingClientRect();
		const vh = window.innerHeight || 1;
		const p =
			opts.mode === 'enter'
				? clamp01((vh - r.top) / (vh / 2 + r.height / 2))
				: opts.mode === 'cover'
					? clamp01((vh - r.top) / Math.max(1, r.height))
					: clamp01(-r.top / Math.max(1, r.height - vh));
		if (Math.abs(p - last) > 0.0005 || p === 0 || p === 1) {
			last = p;
			opts.onchange(p);
		}
	};
	const queue = () => {
		if (!raf) raf = requestAnimationFrame(measure);
	};
	measure();
	window.addEventListener('scroll', queue, { passive: true });
	window.addEventListener('resize', queue);
	return {
		update(next: typeof opts) {
			opts = next;
			queue();
		},
		destroy() {
			if (raf) cancelAnimationFrame(raf);
			window.removeEventListener('scroll', queue);
			window.removeEventListener('resize', queue);
		}
	};
}

/**
 * Fades and floats a node up the first time it scrolls into view. The node is
 * only hidden once this runs (`data-rise="wait"`), so it stays visible without JS
 * and in the server-rendered panel.
 */
export function rise(node: HTMLElement) {
	if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return {};
	const r = node.getBoundingClientRect();
	// Already on screen at load: leave it alone rather than blink it out and back.
	if (r.top < window.innerHeight * 0.9) return {};
	node.dataset.rise = 'wait';
	const io = new IntersectionObserver(
		([e]) => {
			if (e.isIntersecting) {
				node.dataset.rise = 'in';
				io.disconnect();
			}
		},
		{ rootMargin: '0px 0px -12% 0px' }
	);
	io.observe(node);
	return { destroy: () => io.disconnect() };
}

/**
 * Sets `data-inview` on the node while it crosses the middle band of the viewport,
 * and `data-seen` once it has. CSS does the rest.
 */
export function inview(node: HTMLElement, margin = '-35% 0px -35% 0px') {
	const io = new IntersectionObserver(
		([e]) => {
			if (e.isIntersecting) {
				node.dataset.inview = 'true';
				node.dataset.seen = 'true';
			} else delete node.dataset.inview;
		},
		{ rootMargin: margin }
	);
	io.observe(node);
	return { destroy: () => io.disconnect() };
}

/**
 * Starts a silent loop. `autoplay` alone is not enough here: Svelte sets `muted` as a
 * property after hydration, not in the server HTML, so the browser sees an unmuted
 * video and blocks it. Skipped for reduced motion (the poster stays).
 */
export function autoloop(node: HTMLVideoElement) {
	node.muted = true;
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	node.play().catch(() => {});
}
