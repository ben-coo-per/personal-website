<script lang="ts">
	/**
	 * A silent video fixed behind the whole project page. It loops while the title block is
	 * on screen. Once the title has faded out it finishes the loop it is on and rests on its
	 * first frame; scrolling back to the top starts it looping again.
	 *
	 * The title block reads `--hero-fade` (1 → 0 over the first 70% of a screen of
	 * scrolling) and `--hero-offset` (how far down the page it starts, so it can fill the
	 * rest of the first screen).
	 */
	interface Props {
		src: string;
		poster?: string;
		label?: string;
	}

	let { src, poster, label }: Props = $props();

	let video: HTMLVideoElement;

	$effect(() => {
		const site = video.closest<HTMLElement>('.site');
		const head = site?.querySelector<HTMLElement>(':scope > .article-head');
		if (!site || !head) return;

		const fit = () => {
			const top = head.getBoundingClientRect().top + window.scrollY;
			site.style.setProperty('--hero-offset', `${top}px`);
		};

		const fade = () => {
			const t = Math.min(1, window.scrollY / (window.innerHeight * 0.7));
			site.style.setProperty('--hero-fade', String(1 - t));
			if (t < 1) {
				video.loop = true;
				if (video.paused) video.play().catch(() => {});
			} else {
				video.loop = false;
			}
		};

		// Rest on the first frame: it is clear sky, where the end of a take may not be.
		const rest = () => {
			video.pause();
			video.currentTime = 0;
		};

		fit();
		fade();
		video.addEventListener('ended', rest);
		window.addEventListener('scroll', fade, { passive: true });
		window.addEventListener('resize', fit);
		return () => {
			video.removeEventListener('ended', rest);
			window.removeEventListener('scroll', fade);
			window.removeEventListener('resize', fit);
			site.style.removeProperty('--hero-fade');
			site.style.removeProperty('--hero-offset');
		};
	});
</script>

<div class="hero-video">
	<video
		bind:this={video}
		{src}
		{poster}
		autoplay
		muted
		loop
		playsinline
		preload="auto"
		aria-label={label}
	></video>
</div>

<style>
	.hero-video {
		position: fixed;
		inset: 0;
		z-index: -1;
		pointer-events: none;
	}

	video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
</style>
