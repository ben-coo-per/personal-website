<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Breaks its content out of the page container to the viewport edges. */
	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="full-bleed {className}">
	{@render children()}
</div>
