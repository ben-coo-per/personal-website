<script lang="ts">
	import { PUBLIC_R2_URL } from '$env/static/public';

	/**
	 * A 3D model (STL) in a figure, orbitable. Emits only markup: a stage with the model
	 * URL in `data-model-src`, an optional poster, and a badge. The `modelViewers` action
	 * mounts the WebGL viewer (three, loaded on demand) when the stage nears the viewport,
	 * so it works on server-rendered bodies too; without WebGL, or in the PDF export, the
	 * poster or an empty themed frame stays.
	 *
	 * Model files in R2 are fetched through the same-origin `/cms-assets` route, because
	 * the bucket sends no CORS headers and a WebGL loader needs them.
	 */
	interface Props {
		src: string;
		/** Accessible name for the stage. */
		label: string;
		/** Shown in the badge after "3D ·"; defaults to "drag to orbit". */
		name?: string;
		poster?: string;
		caption?: string;
		aspect?: '4/3' | '3/2' | '16/9' | '1/1' | '3/4';
		class?: string;
	}

	let { src, label, name, poster, caption, aspect = '4/3', class: className = '' }: Props = $props();

	const sameOrigin = $derived(
		PUBLIC_R2_URL && src.startsWith(PUBLIC_R2_URL) ? src.replace(PUBLIC_R2_URL, '/cms-assets') : src
	);
</script>

<figure class="model {className}" data-aspect={aspect} data-no-lightbox>
	<div class="model__stage" data-model-src={sameOrigin} role="img" aria-label={label}>
		{#if poster}
			<img class="model__poster" src={poster} alt="" aria-hidden="true" loading="lazy" decoding="async" />
		{/if}
		<span class="model__badge" aria-hidden="true">
			<span class="model__badge-dot"></span>
			3D · {name ?? 'drag to orbit'}
		</span>
	</div>
	{#if caption}
		<figcaption>{caption}</figcaption>
	{/if}
</figure>
