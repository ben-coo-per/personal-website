<script lang="ts">
	/**
	 * A project's hero video as the background of a scrolling box (the storehouse panel).
	 * Put it first inside a positioned container; it fills the container and the video
	 * stays pinned in view (sticky) while the content scrolls over it. `height` is the
	 * visible height of whatever scrolls: the panel's height, or the viewport.
	 */
	interface Props {
		src: string;
		poster?: string;
		height?: string;
	}

	let { src, poster, height = '100lvh' }: Props = $props();
</script>

<div class="hero-fill" aria-hidden="true">
	<video {src} {poster} autoplay muted loop playsinline preload="auto" style:height></video>
</div>

<style>
	/* clip, not hidden: hidden would become the sticky video's scroll container. */
	.hero-fill {
		position: absolute;
		inset: 0;
		z-index: 0;
		overflow: clip;
		pointer-events: none;
	}

	video {
		position: sticky;
		top: 0;
		display: block;
		width: 100%;
		object-fit: cover;
	}
</style>
