<script lang="ts">
	/**
	 * The empty corroboration × scalable corner of the gap quadrant. When it
	 * scrolls into view, the deck's red truchet field and the PIGEON word fizzle
	 * into it together (the deck's ToolGap + TruchetReveal, triggered by scroll
	 * instead of a key press).
	 */
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import Multitruchet from './Multitruchet.svelte';
	import type { Layer } from './multitruchet';

	let host: HTMLElement;
	let fill = $state<HTMLCanvasElement | null>(null);
	const reveal = new Tween(0, { easing: cubicOut });

	const layers = $derived<Layer[]>(
		fill
			? [
					{ type: 'image', image: fill, colorize: true, color: '#3a0e16' },
					{ type: 'text', text: 'PIGEON', color: '--color-text-primary' }
				]
			: []
	);

	onMount(() => {
		const c = document.createElement('canvas');
		c.width = c.height = 8;
		const ctx = c.getContext('2d')!;
		ctx.fillStyle = '#3a0e16';
		ctx.fillRect(0, 0, 8, 8);
		fill = c;

		const io = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) {
					reveal.set(1, { duration: 1400 });
					io.disconnect();
				}
			},
			{ rootMargin: '0px 0px -30% 0px' }
		);
		io.observe(host);
		return () => io.disconnect();
	});
</script>

<div class="gap-reveal" bind:this={host}>
	<Multitruchet
		preset="text"
		{layers}
		fg="--color-bg"
		fontFamily="var(--font-display)"
		fontWeight={900}
		rootGrid={16}
		maxDepth={2}
		maskReveal={reveal.current}
		maskRevealStyle="fizzle"
	/>
	<span class="sr-only">PIGEON</span>
</div>

<style>
	.gap-reveal {
		position: absolute;
		inset: 0;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
</style>
