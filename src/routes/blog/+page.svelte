<script lang="ts">
	import type { PageData } from './$types';
	import BlogPostCard from '../../components/BlogPostCard.svelte';
	import { fade } from 'svelte/transition';
	import type { BlogPostMetadata } from '$lib/types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Blog - Ben Cooper</title>
	<meta name="description" content="Blog posts about projects, experiments, and learnings." />
</svelte:head>

{#snippet posts(posts: BlogPostMetadata[])}
	<section class="flex flex-col gap-8 pb-16 py-8">
		<hr class="border-t border-gray-500 md:hidden" />
		<div class="grid md:grid-flow-row-dense grid-cols-2 gap-2 mx-auto place-items-center">
			{#each posts as post}
				<BlogPostCard blogPost={post} />
			{/each}
		</div>
	</section>
{/snippet}

{#snippet about()}
	<section class="text-gray-100 bg-custom-black" in:fade={{ duration: 350 }}>
		<div class="container mx-auto relative">
			<div class="mt-6 md:mt-2 flex flex-col gap-3">
				Well how about that. you've made it to the blog
			</div>
		</div>
	</section>
{/snippet}

<!-- <div class="min-h-screen w-full bg-custom-black">
	<div class="px-4 py-4 md:px-8 border-b border-gray-700 flex justify-between items-center">
		<h1 class="text-3xl font-display text-gray-100">bcLog</h1>

		<a href="/" class="text-xl sm:text-sm hover:text-amber-400" target="_self" in:fade|global>
			Back to main site
		</a>
	</div>
	<div class="container mx-auto max-w-5xl px-4 py-12">
		{#if data.blogPosts.length === 0}
		<p class="text-gray-400">No blog posts yet.</p>
		{:else}{/if}
		</div>
</div> -->

<div class="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-8 px-4 relative">
	<div class="fixed left-0 w-1/3 lg:w-1/4 py-8 pb-10 h-full pl-4">
		{@render about()}
	</div>
	<div class="col-span-1"></div>
	<div class="col-span-2 lg:col-span-3 pt-4">
		{@render posts(data.blogPosts)}
	</div>
</div>
