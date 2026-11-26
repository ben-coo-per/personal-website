<script lang="ts">
	/**
	 * The deck's title field: the red truchet pattern with an animated pigeon
	 * silhouette recoloured into the same grid. Ported from the presentation's
	 * DeckBackground + Title slide, but contained in its host (absolutely
	 * positioned, fills the nearest positioned parent) instead of fixed behind the
	 * whole page, and stopped while off-screen.
	 *
	 * The mask is a looping silhouette video (pigeon-mask.mp4). The engine samples
	 * its current frame every render, so the video must be same-origin (bundled
	 * here, not in R2) and the browser must keep decoding it: it sits on the page
	 * as a 2px, near-invisible element, as in the deck.
	 */
	import { onMount } from 'svelte';
	import { MultitruchetEngine, type EngineOptions } from './multitruchet';
	import maskUrl from './assets/pigeon-mask.mp4';

	let { class: klass = '' }: { class?: string } = $props();

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		const video = document.createElement('video');
		video.src = maskUrl;
		video.muted = true;
		video.defaultMuted = true;
		video.loop = true;
		video.playsInline = true;
		video.preload = 'auto';
		video.setAttribute('muted', '');
		video.setAttribute('playsinline', '');
		video.setAttribute('aria-hidden', 'true');
		video.style.cssText =
			'position:fixed;right:0;bottom:0;width:2px;height:2px;opacity:0.012;pointer-events:none;z-index:2147483647;';
		document.body.appendChild(video);

		const options = (): EngineOptions => ({
			preset: 'background',
			bg: 'transparent',
			bgFg: '#3a0e16',
			rootGrid: window.innerWidth < 768 ? 35 : 100,
			maxDepth: 0,
			detailThreshold: 100,
			animate: !reduced,
			transitionMs: 10000,
			holdMs: 2000,
			seeds: [7, 42, 99, 420, 1337],
			fps: 30,
			dprCap: 1.5,
			layers: [{ type: 'image', image: video, color: '#1a0509' }],
			maskReveal: 1,
			maskRevealStyle: 'fizzle',
			imageFit: 'cover',
			bgLineWeight: 0.25,
			textLineWeight: 0.1
		});

		const engine = new MultitruchetEngine(canvas, options());
		let wide = window.innerWidth >= 768;
		const ro = new ResizeObserver(() => {
			const nowWide = window.innerWidth >= 768;
			if (nowWide !== wide) {
				wide = nowWide;
				engine.setOptions(options());
			} else engine.resize();
		});
		ro.observe(canvas);

		const play = () => {
			const p = video.play();
			if (p && typeof p.catch === 'function') p.catch(() => {});
		};
		let onScreen = false;
		const sync = () => {
			if (onScreen && !document.hidden) {
				if (!reduced) play();
				engine.start();
			} else {
				video.pause();
				engine.stop();
			}
		};
		const io = new IntersectionObserver(([e]) => {
			onScreen = e.isIntersecting;
			sync();
		});
		io.observe(canvas);
		document.addEventListener('visibilitychange', sync);
		// Muted inline video usually autoplays; retry on first interaction if not.
		window.addEventListener('pointerdown', sync, { once: true });
		// With reduced motion the pigeon holds its first frame.
		video.addEventListener('loadeddata', () => engine.resize(), { once: true });

		return () => {
			io.disconnect();
			ro.disconnect();
			document.removeEventListener('visibilitychange', sync);
			window.removeEventListener('pointerdown', sync);
			engine.destroy();
			video.pause();
			video.removeAttribute('src');
			video.load();
			video.remove();
		};
	});
</script>

<canvas bind:this={canvas} class="pigeon-field {klass}" aria-hidden="true"></canvas>

<style>
	.pigeon-field {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		pointer-events: none;
	}
</style>
