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
	let imgEl: HTMLImageElement | undefined = $state();

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
</script>

<span
	class="dither-media {className}"
	data-aspect={aspect}
	data-fill={fill ? 'true' : undefined}
	data-loaded={loaded ? 'true' : undefined}
	data-errored={errored ? 'true' : undefined}
	data-empty={!hasSrc ? 'true' : undefined}
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
