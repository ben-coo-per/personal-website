<script lang="ts">
	/**
	 * A blurred teaser picture with a WIP label over it, for the end of an unfinished
	 * page. Kept out of the lightbox so a click doesn't reveal it.
	 */
	interface Props {
		src: string;
		label?: string;
		note?: string;
		aspect?: '4/3' | '3/2' | '16/9' | '1/1' | '3/4';
		class?: string;
	}

	let {
		src,
		label = 'Work in progress',
		note,
		aspect = '16/9',
		class: className = ''
	}: Props = $props();
</script>

<figure class="wip-veil {className}" data-aspect={aspect} data-no-lightbox>
	<img {src} alt="" aria-hidden="true" loading="lazy" decoding="async" />
	<div class="wip-veil__label">
		<p class="wip-note">
			<strong>{label}</strong>
			{#if note}<span>{note}</span>{/if}
		</p>
	</div>
</figure>
