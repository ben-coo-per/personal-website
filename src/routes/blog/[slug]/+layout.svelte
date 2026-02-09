<script lang="ts">
	import { page } from '$app/stores';
	import { formatDate } from '$lib/utils/format';
	import { IconBrandGithub, IconBrandInstagram, IconBox, IconDownload } from '@tabler/icons-svelte';
	import SlugLayout from '../../../components/SlugLayout.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let blogPost = $derived($page.data.blogPost);
</script>

{#if blogPost}
	<SlugLayout backHref="/blog">
		{#snippet heading()}
			<h1 class="text-4xl font-display text-gray-100">{blogPost.title}</h1>
			<p class="text-lg text-gray-400 mb-4">{formatDate(blogPost.publishedAt)}</p>
		{/snippet}

		{#snippet sidebarContent()}
			<div class="flex flex-col gap-4">
				{#if blogPost.timeSpent}
					<div class="bg-gray-800 rounded-lg px-4 py-3">
						<p class="text-xs text-gray-400 mb-1">Time spent</p>
						<p class="text-xl font-bold" class:text-red-400={blogPost.timeSpent > 7}>
							{blogPost.timeSpent}
							<span class="text-xs text-gray-400">hrs</span>
						</p>
					</div>
				{/if}

				{#if blogPost.githubLink || blogPost.instagramLink || blogPost.onshapeLink}
					<div class="bg-gray-800 rounded-lg px-4 py-3 flex flex-col gap-2">
						<p class="text-xs text-gray-400 mb-1">Links</p>
						{#if blogPost.githubLink}
							<a
								href={blogPost.githubLink}
								target="_blank"
								class="flex items-center gap-2 text-sm text-gray-300 hover:text-amber-300"
							>
								<IconBrandGithub size={16} />
								GitHub
							</a>
						{/if}
						{#if blogPost.instagramLink}
							<a
								href={blogPost.instagramLink}
								target="_blank"
								class="flex items-center gap-2 text-sm text-gray-300 hover:text-amber-300"
							>
								<IconBrandInstagram size={16} />
								Instagram
							</a>
						{/if}
						{#if blogPost.onshapeLink}
							<a
								href={blogPost.onshapeLink}
								target="_blank"
								class="flex items-center gap-2 text-sm text-gray-300 hover:text-amber-300"
							>
								<IconBox size={16} />
								Onshape
							</a>
						{/if}
					</div>
				{/if}

				{#if blogPost.downloadableFile}
					<div class="bg-gray-800 rounded-lg px-4 py-3">
						<p class="text-xs text-gray-400 mb-1">Files</p>
						<a
							href="/cms-assets/blog/{blogPost.slug}/{blogPost.downloadableFile}"
							download
							class="flex items-center gap-2 text-sm text-gray-300 hover:text-amber-300"
						>
							<IconDownload size={16} />
							Download
						</a>
					</div>
				{/if}
			</div>
		{/snippet}

		{@render children?.()}
	</SlugLayout>
{:else}
	{@render children?.()}
{/if}
