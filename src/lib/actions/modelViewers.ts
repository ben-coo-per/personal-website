/**
 * Mounts a WebGL viewer on every `[data-model-src]` stage in the body (the `Model`
 * component, or a hand-written div in markdown) once it comes within half a screen of
 * the viewport. The viewer itself (three.js) is imported on demand, so pages without a
 * model never load it. Re-scans on subtree mutations for swapped panel bodies.
 */
const PROCESSED = 'modelProcessed';

type Handle = { destroy(): void };

export function modelViewers(node: HTMLElement) {
	if (typeof IntersectionObserver === 'undefined') return {};

	const handles = new Set<Handle>();

	const nearby = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				const stage = entry.target as HTMLElement;
				nearby.unobserve(stage);
				const src = stage.dataset.modelSrc;
				if (!src) continue;
				stage.dataset.modelState = 'loading';
				import('$lib/viewer/stl')
					.then(({ mount }) => handles.add(mount(stage, src)))
					.catch(() => {
						stage.dataset.modelState = 'error';
					});
			}
		},
		{ rootMargin: '50% 0px' }
	);

	const watch = (stage: HTMLElement) => {
		if (stage.dataset[PROCESSED] === 'true') return;
		stage.dataset[PROCESSED] = 'true';
		nearby.observe(stage);
	};

	const scan = (root: HTMLElement) => {
		if (root.dataset?.modelSrc) watch(root);
		root.querySelectorAll<HTMLElement>('[data-model-src]').forEach(watch);
	};

	scan(node);

	const observer = new MutationObserver((mutations) => {
		for (const m of mutations) {
			if (m.type !== 'childList') continue;
			m.addedNodes.forEach((added) => {
				if (added.nodeType === Node.ELEMENT_NODE) scan(added as HTMLElement);
			});
		}
	});
	observer.observe(node, { childList: true, subtree: true });

	return {
		destroy() {
			observer.disconnect();
			nearby.disconnect();
			handles.forEach((h) => h.destroy());
			handles.clear();
		}
	};
}
