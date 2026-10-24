<script lang="ts">
	/**
	 * One picture, optionally captioned and cropped to a fixed ratio. Emits plain
	 * markup styled by log.css; the `ditherImages` action supplies the loading state.
	 */
	interface Props {
		src: string;
		alt: string;
		caption?: string;
		aspect?: '4/3' | '3/2' | '16/9' | '1/1' | '3/4';
		loading?: 'lazy' | 'eager';
		class?: string;
	}

	let { src, alt, caption, aspect, loading = 'lazy', class: className = '' }: Props = $props();
</script>

<figure class={className || undefined} data-aspect={aspect}>
	<img {src} {alt} {loading} decoding="async" />
	{#if caption}
		<figcaption>{caption}</figcaption>
	{/if}
</figure>
