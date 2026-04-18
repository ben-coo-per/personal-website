<script lang="ts">
	import { page } from '$app/stores';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let project = $derived($page.data.project);
</script>

<div class="site">
	<a class="back" href="/projects">← projects</a>

	{#if project}
		<div class="article-head">
			<div class="eyebrow">{project.date?.getFullYear() ?? ''}</div>
			<h1>{project.title}</h1>
			{#if project.subtitle}
				<p class="subtitle">{project.subtitle}</p>
			{/if}
			{#if project.mainDescription}
				<p class="desc">{project.mainDescription}</p>
			{/if}
		</div>
	{/if}

	{@render children?.()}
</div>

<style>
	.desc {
		margin-top: 14px;
		font-size: 15px;
		line-height: 1.6;
		color: var(--ink-3);
		max-width: var(--max-width-prose);
	}
</style>
