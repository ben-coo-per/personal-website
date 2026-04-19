<script lang="ts">
	import { page } from '$app/stores';
	import { formatDate } from '$lib/utils/format';
	import { IconBrandGithub, IconBrandInstagram, IconBox, IconDownload } from '@tabler/icons-svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let blogPost = $derived($page.data.blogPost);
</script>

<div class="site">
	<a class="back" href="/blog">← writing</a>

	{#if blogPost}
		<div class="article-head">
			<div class="eyebrow">{formatDate(blogPost.publishedAt)}</div>
			<h1>{blogPost.title}</h1>
			{#if blogPost.excerpt}
				<p class="subtitle">{blogPost.excerpt}</p>
			{/if}
			{#if blogPost.githubLink || blogPost.instagramLink || blogPost.onshapeLink || blogPost.downloadableFile}
				<div class="links-panel">
					{#if blogPost.githubLink}
						<a href={blogPost.githubLink} target="_blank" rel="noreferrer" class="link-item">
							<IconBrandGithub size={14} /><span>GitHub</span>
						</a>
					{/if}
					{#if blogPost.instagramLink}
						<a href={blogPost.instagramLink} target="_blank" rel="noreferrer" class="link-item">
							<IconBrandInstagram size={14} /><span>Instagram</span>
						</a>
					{/if}
					{#if blogPost.onshapeLink}
						<a href={blogPost.onshapeLink} target="_blank" rel="noreferrer" class="link-item">
							<IconBox size={14} /><span>Onshape</span>
						</a>
					{/if}
					{#if blogPost.downloadableFile}
						<a href="/cms-assets/blog/{blogPost.slug}/{blogPost.downloadableFile}" download class="link-item">
							<IconDownload size={14} /><span>Download</span>
						</a>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<div class="article-body">
		{@render children?.()}
	</div>
</div>

<style>
	.links-panel {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-top: 24px;
	}

	.link-item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--ink-2);
		border: 1px solid var(--rule-2);
		border-radius: 999px;
		padding: 5px 12px;
		transition: color 0.15s, border-color 0.15s;
	}

	.link-item:hover { color: var(--amber); border-color: var(--amber); }
</style>
