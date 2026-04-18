<script lang="ts">
	import type { BlogPostMetadata } from '$lib/types';
	import { formatDate } from '$lib/utils/format';

	interface Props {
		blogPost: BlogPostMetadata;
	}

	let { blogPost }: Props = $props();
</script>

<a class="post-card" href="/blog/{blogPost.slug}">
	<div class="post-body">
		<div class="post-meta">
			<span class="dot"></span>
			<span>{formatDate(blogPost.publishedAt)}</span>
			{#if blogPost.timeSpent}
				<span class="time">{blogPost.timeSpent}h</span>
			{/if}
		</div>
		<h3>{blogPost.title} <span class="arrow">↗</span></h3>
		{#if blogPost.excerpt}
			<p>{blogPost.excerpt}</p>
		{/if}
	</div>
</a>

<style>
	.post-card {
		display: block;
		border: 1px solid var(--rule);
		background: rgba(17, 17, 20, 0.5);
		border-radius: var(--radius);
		overflow: hidden;
		backdrop-filter: blur(4px);
		transition: border-color 0.2s, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s;
		text-decoration: none;
		color: inherit;
	}

	.post-card:hover {
		border-color: var(--rule-2);
		transform: translateY(-2px);
		background: rgba(23, 23, 28, 0.7);
	}

	.post-body { padding: 20px 22px 22px; display: flex; flex-direction: column; gap: 8px; }

	.post-meta {
		display: flex;
		gap: 10px;
		align-items: center;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--amber); flex-shrink: 0; }
	.time { margin-left: auto; }

	h3 {
		font-size: 20px;
		line-height: 1.1;
		letter-spacing: -0.02em;
		margin: 2px 0 0;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.arrow {
		font-family: var(--font-mono);
		color: var(--ink-3);
		font-size: 14px;
		transition: transform 0.25s, color 0.25s;
	}

	.post-card:hover .arrow { transform: translate(3px, -3px); color: var(--amber); }

	p { margin: 4px 0 0; font-size: 14px; line-height: 1.45; color: var(--ink-2); max-width: 44ch; }
</style>
