/**
 * Enhances every `.image-scroller` in CMS-rendered HTML (injected via `{@html …}`)
 * with prev/next buttons, since trackpad/touch sideways-scroll isn't discoverable.
 *
 * Mirrors `ditherImages`: idempotent per element, and re-runs on subtree mutations
 * so dynamically-swapped article bodies (e.g. the storehouse panel) get buttons too.
 */
const ENHANCED = 'scrollerEnhanced';

function makeButton(direction: 'prev' | 'next'): HTMLButtonElement {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = `image-scroller__nav image-scroller__nav--${direction}`;
	btn.setAttribute('aria-label', direction === 'prev' ? 'Scroll images left' : 'Scroll images right');
	const d = direction === 'prev' ? 'M15 4l-8 8 8 8' : 'M9 4l8 8-8 8';
	btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${d}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
	return btn;
}

function enhance(scroller: HTMLElement, cleanups: Array<() => void>) {
	if (scroller.dataset[ENHANCED] === 'true') return;
	const parent = scroller.parentNode;
	if (!parent) return;
	scroller.dataset[ENHANCED] = 'true';

	const wrap = document.createElement('div');
	wrap.className = 'image-scroller-wrap';
	parent.insertBefore(wrap, scroller);

	const prev = makeButton('prev');
	const next = makeButton('next');
	wrap.appendChild(prev);
	wrap.appendChild(scroller);
	wrap.appendChild(next);

	// Images aren't uniform width, so step by actual items and center the target
	// in the viewport — a fixed pixel step would land mid-image.
	const itemCenters = () => {
		const base = scroller.getBoundingClientRect().left - scroller.scrollLeft;
		return Array.from(scroller.children)
			.map((child) => {
				const rect = (child as HTMLElement).getBoundingClientRect();
				return Math.round(rect.left - base + rect.width / 2);
			})
			.sort((a, b) => a - b);
	};

	const scrollToItem = (direction: 1 | -1) => {
		const maxScroll = scroller.scrollWidth - scroller.clientWidth;
		const viewportCenter = scroller.scrollLeft + scroller.clientWidth / 2;
		const centers = itemCenters();
		const targetCenter =
			direction === 1
				? centers.find((c) => c > viewportCenter + 2)
				: [...centers].reverse().find((c) => c < viewportCenter - 2);
		if (targetCenter === undefined) return;
		const target = targetCenter - scroller.clientWidth / 2;
		scroller.scrollTo({ left: Math.max(0, Math.min(target, maxScroll)), behavior: 'smooth' });
	};

	const onPrev = () => scrollToItem(-1);
	const onNext = () => scrollToItem(1);
	prev.addEventListener('click', onPrev);
	next.addEventListener('click', onNext);

	const update = () => {
		const maxScroll = scroller.scrollWidth - scroller.clientWidth;
		wrap.dataset.overflow = maxScroll > 1 ? 'true' : 'false';
		prev.disabled = scroller.scrollLeft <= 1;
		next.disabled = scroller.scrollLeft >= maxScroll - 1;
	};

	scroller.addEventListener('scroll', update, { passive: true });

	// Observe the scroller and its images: image loads change scrollWidth without
	// resizing the scroller's own box, so we watch the images directly too.
	const ro = new ResizeObserver(update);
	ro.observe(scroller);
	scroller.querySelectorAll('img').forEach((img) => ro.observe(img));

	update();

	cleanups.push(() => {
		ro.disconnect();
		scroller.removeEventListener('scroll', update);
		prev.removeEventListener('click', onPrev);
		next.removeEventListener('click', onNext);
	});
}

export function imageScrollers(node: HTMLElement) {
	const cleanups: Array<() => void> = [];
	const processAll = (root: HTMLElement) => {
		root
			.querySelectorAll<HTMLElement>('.image-scroller:not([data-scroller-enhanced])')
			.forEach((el) => enhance(el, cleanups));
	};

	processAll(node);

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== 'childList') continue;
			mutation.addedNodes.forEach((added) => {
				if (added.nodeType !== Node.ELEMENT_NODE) return;
				const el = added as HTMLElement;
				if (el.classList.contains('image-scroller')) {
					enhance(el, cleanups);
				} else {
					processAll(el);
				}
			});
		}
	});

	observer.observe(node, { childList: true, subtree: true });

	return {
		destroy() {
			observer.disconnect();
			cleanups.forEach((fn) => fn());
		}
	};
}
