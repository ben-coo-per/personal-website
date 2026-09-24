<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// The profile is a folded YAML scalar: one paragraph per line.
	const paragraphs = $derived(data.text.split('\n').filter(Boolean));
</script>

<div class="site">
	<span class="label">/ for robots</span>
	<div class="robots-text">
		{#each paragraphs as p}<p>{p}</p>{/each}
	</div>
</div>

<style>
	.label {
		display: block;
		padding: 36px 6px 0;
	}

	.robots-text {
		padding: 28px 6px 0;
		max-width: var(--max-width-prose);
		font-family: var(--font-mono);
		font-size: 13px;
		line-height: 1.7;
		color: var(--ink-2);
	}

	.robots-text p {
		margin: 0 0 1.2em;
	}
</style>
