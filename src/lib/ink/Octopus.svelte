<script lang="ts">
	/**
	 * The INKER octopus on a transparent background. `poster` is the same drawing as a
	 * still, so server-rendered HTML and the PDF export have a picture; the live renderer
	 * is loaded on mount and takes over once its first frame is on the canvas.
	 *
	 * `dither-media` here stops the ditherImages action wrapping the poster in its opaque
	 * loading shell. data-no-lightbox keeps it from opening the lightbox.
	 */
	import { onMount } from 'svelte';

	interface Props {
		poster?: string;
		alt?: string;
		class?: string;
	}

	let { poster, alt = '', class: className = '' }: Props = $props();

	let canvas: HTMLCanvasElement;
	let ready = $state(false);

	onMount(() => {
		let stop: (() => void) | undefined;
		let gone = false;
		import('./octopus').then(({ start }) => {
			if (!gone) stop = start(canvas, { onReady: () => (ready = true) });
		});
		return () => {
			gone = true;
			stop?.();
		};
	});
</script>

<div class="octopus dither-media {className}" data-no-lightbox>
	{#if poster}
		<img src={poster} {alt} class:gone={ready} />
	{/if}
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<style>
	.octopus {
		position: relative;
		aspect-ratio: 4 / 3;
		background: transparent;
		isolation: auto;
	}

	img,
	canvas {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		margin: 0;
	}

	img.gone {
		visibility: hidden;
	}
</style>
