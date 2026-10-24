<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * Stacks figures, grids and clips at the grid gap: one continuous gallery. `spacious`
	 * spreads them far apart instead, one picture per beat; pair it with `class="narrow"`
	 * on single figures for a centred column.
	 */
	interface Props {
		spacious?: boolean;
		class?: string;
		children: Snippet;
	}

	let { spacious = false, class: className = '', children }: Props = $props();
</script>

<div class="media-stack {spacious ? 'spacious' : ''} {className}">
	{@render children()}
</div>
