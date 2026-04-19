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
			{#if project.websiteUrl || project.githubLink}
				<div class="head-links">
					{#if project.websiteUrl}
						<a href={project.websiteUrl} target="_blank" rel="noopener noreferrer">website ↗</a>
					{/if}
					{#if project.githubLink}
						<a href={project.githubLink} target="_blank" rel="noopener noreferrer">github ↗</a>
					{/if}
				</div>
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

	.head-links {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-top: 16px;
	}

	.head-links a {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--ink-3);
		border: 1px solid var(--rule);
		border-radius: 20px;
		padding: 4px 10px;
		transition: border-color 0.15s, color 0.15s;
	}

	.head-links a:hover {
		border-color: var(--amber);
		color: var(--amber);
	}
</style>
