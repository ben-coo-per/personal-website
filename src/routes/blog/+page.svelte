<script lang="ts">
	import BlogPostCard from '../../components/BlogPostCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Writing – Ben Cooper</title>
	<meta name="description" content="Blog posts about projects, experiments, and learnings." />
</svelte:head>

<div class="site">
	<div class="sec-head">
		<span class="label">/ writing</span>
		<h2>experiments, build logs, and occasional essays.</h2>
		<span class="count">{String(data.blogPosts.length).padStart(2, '0')} posts</span>
	</div>

	<div class="posts-grid">
		{#each data.blogPosts as post}
			<BlogPostCard blogPost={post} />
		{/each}

		{#if data.blogPosts.length === 0}
			<p class="empty">nothing here yet.</p>
		{/if}
	</div>
</div>

<style>
	.posts-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
	}

	.empty {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--ink-3);
		padding: 40px 6px;
	}

	@media (max-width: 960px) { .posts-grid { grid-template-columns: repeat(2, 1fr); } }
	@media (max-width: 600px) { .posts-grid { grid-template-columns: 1fr; } }
</style>
