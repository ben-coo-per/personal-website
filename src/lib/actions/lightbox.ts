/**
 * Click any image in an article body to view it full screen, with prev/next across
 * every image in that body. Works on markdown output, freeform pages and the
 * server-rendered storehouse panel alike because it only reads the DOM at click time
 * (so it needs no MutationObserver). Images inside links are left to the link.
 */
const ICON = {
	prev: 'M15 4l-8 8 8 8',
	next: 'M9 4l8 8-8 8',
	close: 'M6 6l12 12M18 6L6 18'
};

function button(kind: 'prev' | 'next' | 'close', label: string): HTMLButtonElement {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = kind === 'close' ? 'lightbox__close' : `lightbox__nav lightbox__nav--${kind}`;
	btn.setAttribute('aria-label', label);
	btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${ICON[kind]}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
	return btn;
}

function captionOf(img: HTMLImageElement): string {
	const fig = img.closest('figure');
	const cap = fig?.querySelector('figcaption')?.textContent?.trim();
	return cap || img.alt?.trim() || '';
}

export function lightbox(node: HTMLElement) {
	let overlay: HTMLDivElement | null = null;
	let items: HTMLImageElement[] = [];
	let index = 0;
	let imgEl: HTMLImageElement;
	let capEl: HTMLDivElement;
	let countEl: HTMLDivElement;
	let prevBtn: HTMLButtonElement;
	let nextBtn: HTMLButtonElement;
	let previousOverflow = '';

	const candidates = () =>
		Array.from(node.querySelectorAll<HTMLImageElement>('img')).filter(
			(img) =>
				!img.closest('a') &&
				!img.closest('.lightbox') &&
				!img.closest('[data-no-lightbox]') &&
				img.getAttribute('src')
		);

	const show = (i: number) => {
		index = Math.max(0, Math.min(i, items.length - 1));
		const img = items[index];
		imgEl.src = img.currentSrc || img.src;
		imgEl.alt = img.alt;
		capEl.textContent = captionOf(img);
		countEl.textContent = items.length > 1 ? `${index + 1} / ${items.length}` : '';
		prevBtn.disabled = index === 0;
		nextBtn.disabled = index === items.length - 1;
		// Warm the neighbours.
		for (const n of [index - 1, index + 1]) {
			const neighbour = items[n];
			if (neighbour) new Image().src = neighbour.currentSrc || neighbour.src;
		}
	};

	const close = () => {
		if (!overlay) return;
		overlay.dataset.open = 'false';
		document.removeEventListener('keydown', onKey);
		document.documentElement.style.overflow = previousOverflow;
		const el = overlay;
		overlay = null;
		window.setTimeout(() => el.remove(), 200);
	};

	const onKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape') close();
		else if (e.key === 'ArrowLeft') show(index - 1);
		else if (e.key === 'ArrowRight') show(index + 1);
	};

	const open = (img: HTMLImageElement) => {
		items = candidates();
		const start = items.indexOf(img);
		if (start === -1) return;

		overlay = document.createElement('div');
		overlay.className = 'lightbox';
		overlay.setAttribute('role', 'dialog');
		overlay.setAttribute('aria-modal', 'true');

		const stage = document.createElement('div');
		stage.className = 'lightbox__stage';
		imgEl = document.createElement('img');
		imgEl.className = 'lightbox__img';
		imgEl.decoding = 'async';
		stage.appendChild(imgEl);

		capEl = document.createElement('div');
		capEl.className = 'lightbox__caption';
		countEl = document.createElement('div');
		countEl.className = 'lightbox__count';

		prevBtn = button('prev', 'Previous image');
		nextBtn = button('next', 'Next image');
		const closeBtn = button('close', 'Close');

		prevBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			show(index - 1);
		});
		nextBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			show(index + 1);
		});
		closeBtn.addEventListener('click', close);
		imgEl.addEventListener('click', (e) => e.stopPropagation());
		overlay.addEventListener('click', close);

		overlay.append(stage, capEl, countEl, prevBtn, nextBtn, closeBtn);
		document.body.appendChild(overlay);
		previousOverflow = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		document.addEventListener('keydown', onKey);
		show(start);
		requestAnimationFrame(() => {
			if (overlay) overlay.dataset.open = 'true';
		});
	};

	const onClick = (e: MouseEvent) => {
		const target = e.target as HTMLElement | null;
		const img = target?.closest('img') as HTMLImageElement | null;
		if (!img || !node.contains(img) || img.closest('a') || img.closest('[data-no-lightbox]')) return;
		e.preventDefault();
		open(img);
	};

	node.addEventListener('click', onClick);

	return {
		destroy() {
			node.removeEventListener('click', onClick);
			close();
		}
	};
}
