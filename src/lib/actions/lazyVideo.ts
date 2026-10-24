/**
 * Keeps video-heavy pages cheap: every <video> in the body starts with preload="none"
 * (set by the renderer or the Clip component) and is only allowed to fetch metadata
 * once it comes within a screen of the viewport. Clips marked data-autoplay (silent
 * loops) play while visible and pause when scrolled away. Re-scans on subtree
 * mutations so the storehouse panel picks up swapped bodies.
 */
const SEEN = 'lazyVideoSeen';

export function lazyVideo(node: HTMLElement) {
	if (typeof IntersectionObserver === 'undefined') return {};

	const nearby = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				const video = entry.target as HTMLVideoElement;
				if (video.preload === 'none') video.preload = 'metadata';
				nearby.unobserve(video);
			}
		},
		{ rootMargin: '100% 0px' }
	);

	const visible = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				const video = entry.target as HTMLVideoElement;
				if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
					video.muted = true;
					video.play().catch(() => {});
				} else if (!video.paused) {
					video.pause();
				}
			}
		},
		{ threshold: [0, 0.3] }
	);

	const watch = (video: HTMLVideoElement) => {
		if (video.dataset[SEEN] === 'true') return;
		video.dataset[SEEN] = 'true';
		if (!video.hasAttribute('preload')) video.preload = 'none';
		nearby.observe(video);
		if (video.dataset.autoplay === 'true') visible.observe(video);
	};

	const scan = (root: HTMLElement) => {
		if (root.tagName === 'VIDEO') watch(root as HTMLVideoElement);
		root.querySelectorAll<HTMLVideoElement>('video').forEach(watch);
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
			visible.disconnect();
		}
	};
}
