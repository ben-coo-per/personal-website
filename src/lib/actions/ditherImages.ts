/**
 * Wraps every <img> descendant in a `.dither-media` shell so CMS-rendered HTML
 * (injected via `{@html …}`) gets the same loading treatment as DitherMedia.svelte.
 *
 * Re-runs on subtree mutations so dynamically-swapped article bodies (e.g. the
 * storehouse panel) pick up new images.
 */
const PROCESSED = 'ditherProcessed';

function wrap(img: HTMLImageElement) {
	if (img.dataset[PROCESSED] === 'true') return;
	if (img.closest('.dither-media')) {
		img.dataset[PROCESSED] = 'true';
		return;
	}

	const wrapper = document.createElement('span');
	wrapper.className = 'dither-media';
	if (img.complete && img.naturalWidth > 0) {
		wrapper.dataset.loaded = 'true';
	}

	const placeholder = document.createElement('span');
	placeholder.className = 'dither-media__placeholder';
	placeholder.setAttribute('aria-hidden', 'true');

	const dither = document.createElement('span');
	dither.className = 'dither-media__dither';
	dither.setAttribute('aria-hidden', 'true');

	const parent = img.parentNode;
	if (!parent) return;

	parent.insertBefore(wrapper, img);
	wrapper.appendChild(placeholder);
	wrapper.appendChild(dither);
	wrapper.appendChild(img);

	img.classList.add('dither-media__img');
	img.dataset[PROCESSED] = 'true';

	const onLoad = () => {
		wrapper.dataset.loaded = 'true';
	};
	const onError = () => {
		wrapper.dataset.errored = 'true';
	};

	if (img.complete && img.naturalWidth > 0) {
		// Already cached — flag as loaded synchronously.
		wrapper.dataset.loaded = 'true';
	} else if (img.complete && img.naturalWidth === 0) {
		wrapper.dataset.errored = 'true';
	} else {
		img.addEventListener('load', onLoad, { once: true });
		img.addEventListener('error', onError, { once: true });
	}
}

function processAll(root: HTMLElement) {
	const imgs = root.querySelectorAll<HTMLImageElement>('img:not([data-dither-processed])');
	imgs.forEach(wrap);
}

export function ditherImages(node: HTMLElement) {
	processAll(node);

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== 'childList') continue;
			mutation.addedNodes.forEach((added) => {
				if (added.nodeType !== Node.ELEMENT_NODE) return;
				const el = added as HTMLElement;
				if (el.tagName === 'IMG') {
					wrap(el as HTMLImageElement);
				} else {
					el.querySelectorAll?.<HTMLImageElement>('img:not([data-dither-processed])').forEach(wrap);
				}
			});
		}
	});

	observer.observe(node, { childList: true, subtree: true });

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
