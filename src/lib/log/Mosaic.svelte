<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A loose, hand-placed gallery: a 12-column grid of MosaicCells that keep each
	 * picture's own shape, with varied widths and vertical offsets so it doesn't read as a
	 * uniform contact sheet. Narrow bodies fall back to two columns.
	 */
	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="mosaic {className}">
	{@render children()}
</div>
