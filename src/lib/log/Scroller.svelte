<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A horizontally scrolling, edge-to-edge row of uniform-height images. Put Figures
	 * or bare <img>s inside. The `imageScrollers` action adds prev/next buttons.
	 */
	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="image-scroller {className}">
	{@render children()}
</div>
