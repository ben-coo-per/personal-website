<script lang="ts">
	interface Props {
		src: string | null | undefined;
		alt: string;
		aspect?: '4/3' | '16/9' | '1/1';
		loading?: 'lazy' | 'eager';
		objectFit?: 'cover' | 'contain';
		fill?: boolean;
		class?: string;
		children?: import('svelte').Snippet;
	}

	let {
		src,
		alt,
		aspect,
		loading = 'lazy',
		objectFit = 'cover',
		fill = false,
		class: className = '',
		children
	}: Props = $props();

	let loaded = $state(false);
	let errored = $state(false);
	let glimmerReady = $state(false);
	let imgEl: HTMLImageElement | undefined = $state();
	let wrapperEl: HTMLSpanElement | undefined = $state();

	const hasSrc = $derived(!!src);

	function handleLoad() {
		loaded = true;
	}

	function handleError() {
		errored = true;
	}

	$effect(() => {
		if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
			loaded = true;
		}
	});

	// Randomize the glimmer animation per instance so a grid of images doesn't march in unison.
	// Done in $effect (client-only) to avoid SSR/CSR mismatch from Math.random(); the
	// `glimmerReady` flag gates the overlay's visibility so we don't see the keyframe-0%
	// state flash before the random delay applies.
	$effect(() => {
		if (!wrapperEl) return;
		const duration = 11 + Math.random() * 9; // 11–20s
		const delay = -(Math.random() * duration); // negative → start mid-loop
		const direction = Math.random() < 0.5 ? 'normal' : 'reverse';
		wrapperEl.style.setProperty('--dither-glimmer-duration', `${duration.toFixed(2)}s`);
		wrapperEl.style.setProperty('--dither-glimmer-delay', `${delay.toFixed(2)}s`);
		wrapperEl.style.setProperty('--dither-glimmer-direction', direction);
		glimmerReady = true;
	});
</script>

<span
	bind:this={wrapperEl}
	class="dither-media {className}"
	data-aspect={aspect}
	data-fill={fill ? 'true' : undefined}
	data-loaded={loaded ? 'true' : undefined}
	data-errored={errored ? 'true' : undefined}
	data-empty={!hasSrc ? 'true' : undefined}
	data-glimmer-ready={glimmerReady ? 'true' : undefined}
>
	<span class="dither-media__placeholder" aria-hidden="true"></span>
	{#if hasSrc && !errored}
		<span class="dither-media__dither" aria-hidden="true"></span>
		<img
			bind:this={imgEl}
			class="dither-media__img"
			data-fit={objectFit}
			src={src ?? undefined}
			{alt}
			{loading}
			onload={handleLoad}
			onerror={handleError}
		/>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</span>
