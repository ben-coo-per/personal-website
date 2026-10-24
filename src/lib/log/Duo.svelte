<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Two columns, text beside media, stacking when the body is narrow. */
	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="duo {className}">
	{@render children()}
</div>
