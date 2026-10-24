<script lang="ts">
	/**
	 * A video. Loads nothing until it nears the viewport (`lazyVideo` action). With
	 * `autoplay` it is a silent looping clip that plays while in view; otherwise it has
	 * controls. Give big files a `poster` so the page has a frame before any bytes arrive.
	 */
	interface Props {
		src: string;
		poster?: string;
		caption?: string;
		autoplay?: boolean;
		loop?: boolean;
		label?: string;
		class?: string;
	}

	let {
		src,
		poster,
		caption,
		autoplay = false,
		loop = autoplay,
		label,
		class: className = ''
	}: Props = $props();
</script>

{#snippet video()}
	<video
		{src}
		{poster}
		preload="none"
		playsinline
		controls={!autoplay}
		muted={autoplay}
		{loop}
		data-autoplay={autoplay ? 'true' : undefined}
		aria-label={label ?? caption}
	></video>
{/snippet}

{#if caption}
	<figure class={className || undefined}>
		{@render video()}
		<figcaption>{caption}</figcaption>
	</figure>
{:else if className}
	<div class={className}>{@render video()}</div>
{:else}
	{@render video()}
{/if}
