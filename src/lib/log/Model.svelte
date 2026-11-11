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
		/** The small "3D · …" tag in the corner. Off when the cursor and hover state are cue enough. */
		badge?: boolean;
		poster?: string;
		caption?: string;
		aspect?: '4/3' | '3/2' | '16/9' | '1/1' | '3/4';
		/** No frame or fill: the model floats on the page. */
		bare?: boolean;
		/** Mesh colour (any CSS colour), for a model that has to sit on a particular
		 *  background. Defaults to the page's ink. */
		color?: string;
		/** Colour of the light cast across the model from the shadow side (any CSS colour),
		 *  to match the page's ground. Defaults to the site's amber. */
		light?: string;
		class?: string;
	}

	let {
		src,
		label,
		name,
		badge = true,
		poster,
		caption,
		aspect = '4/3',
		bare = false,
		color,
		light,
		class: className = ''
	}: Props = $props();

	const sameOrigin = $derived(
		PUBLIC_R2_URL && src.startsWith(PUBLIC_R2_URL) ? src.replace(PUBLIC_R2_URL, '/cms-assets') : src
	);

	const vars = $derived(
		[color && `--model-color: ${color}`, light && `--model-light: ${light}`].filter(Boolean).join('; ') ||
			undefined
	);
</script>

<figure class="model {bare ? 'model--bare' : ''} {className}" data-aspect={aspect} data-no-lightbox>
	<div
		class="model__stage"
		data-model-src={sameOrigin}
		role="img"
		aria-label={label}
		style={vars}
	>
		{#if poster}
			<img class="model__poster" src={poster} alt="" aria-hidden="true" loading="lazy" decoding="async" />
		{/if}
		{#if badge}
			<span class="model__badge" aria-hidden="true">
				<span class="model__badge-dot"></span>
				3D · {name ?? 'drag to orbit'}
			</span>
		{/if}
	</div>
	{#if caption}
		<figcaption>{caption}</figcaption>
	{/if}
</figure>
