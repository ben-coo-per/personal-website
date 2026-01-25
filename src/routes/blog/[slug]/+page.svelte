<script lang="ts">
	import type { PageData } from './$types';
	import { marked } from 'marked';
	import { formatDate } from '$lib/utils/format';
	import { IconBrandGithub, IconBrandInstagram, IconBox, IconDownload } from '@tabler/icons-svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Configure marked for safe rendering
	const renderedContent = $derived(marked.parse(data.content));
</script>

<svelte:head>
	<title>{data.blogPost.title} - Ben Cooper</title>
	<meta name="description" content={data.blogPost.excerpt} />
</svelte:head>

<div class="min-h-screen bg-custom-black">
	<!-- Header section -->
	<div class="border-b border-gray-700 bg-gray-900 py-12">
		<div class="container mx-auto max-w-5xl px-4">
			<div class="flex flex-col items-start justify-between gap-6 sm:flex-row">
				<div>
					<nav class="mb-4 text-sm text-gray-400">
						<a href="/" class="hover:text-amber-300">Home</a>
						<span class="mx-2">/</span>
						<a href="/blog" class="hover:text-amber-300">Blog</a>
						<span class="mx-2">/</span>
						<span class="text-gray-300">{data.blogPost.title}</span>
					</nav>
					<h1 class="mb-2 text-4xl font-display text-gray-100">{data.blogPost.title}</h1>
					<p class="text-gray-400">{formatDate(data.blogPost.publishedAt)}</p>
				</div>

				<div class="flex flex-wrap gap-3">
					{#if data.blogPost.timeSpent}
						<div class="bg-gray-800 rounded-lg px-4 py-3">
							<p class="text-xs text-gray-400 mb-1">Time spent</p>
							<p class="text-xl font-bold" class:text-red-400={data.blogPost.timeSpent > 7}>
								{data.blogPost.timeSpent}
								<span class="text-xs text-gray-400">hrs</span>
							</p>
						</div>
					{/if}

					{#if data.blogPost.githubLink || data.blogPost.instagramLink || data.blogPost.onshapeLink}
						<div class="bg-gray-800 rounded-lg px-4 py-3 flex flex-col gap-1">
							{#if data.blogPost.githubLink}
								<a
									href={data.blogPost.githubLink}
									target="_blank"
									class="flex items-center gap-2 text-sm text-gray-300 hover:text-amber-300"
								>
									<IconBrandGithub size={16} />
									GitHub
								</a>
							{/if}
							{#if data.blogPost.instagramLink}
								<a
									href={data.blogPost.instagramLink}
									target="_blank"
									class="flex items-center gap-2 text-sm text-gray-300 hover:text-amber-300"
								>
									<IconBrandInstagram size={16} />
									Instagram
								</a>
							{/if}
							{#if data.blogPost.onshapeLink}
								<a
									href={data.blogPost.onshapeLink}
									target="_blank"
									class="flex items-center gap-2 text-sm text-gray-300 hover:text-amber-300"
								>
									<IconBox size={16} />
									Onshape
								</a>
							{/if}
						</div>
					{/if}

					{#if data.blogPost.downloadableFile}
						<div class="bg-gray-800 rounded-lg px-4 py-3">
							<p class="text-xs text-gray-400 mb-1">Files</p>
							<a
								href="/cms-assets/blog/{data.blogPost.slug}/{data.blogPost.downloadableFile}"
								download
								class="flex items-center gap-2 text-sm text-gray-300 hover:text-amber-300"
							>
								<IconDownload size={16} />
								Download
							</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Content -->
	<div class="container mx-auto max-w-5xl px-4 py-12">
		<article class="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-xl">
			{@html renderedContent}
		</article>
	</div>
</div>
