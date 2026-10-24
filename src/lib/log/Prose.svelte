<script lang="ts">
	import type { Snippet } from 'svelte';

	/** A centred text column at the article measure, for anything that isn't a bare <p>. */
	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class="prose {className}">
	{@render children()}
</div>
