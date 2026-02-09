<script lang="ts">
	import type { PageData } from './$types';
	import BlogPostCard from '../../components/BlogPostCard.svelte';
	import { fade } from 'svelte/transition';
	import type { BlogPostMetadata } from '$lib/types';
	import ContentLayout from '../../components/ContentLayout.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Blog - Ben Cooper</title>
	<meta name="description" content="Blog posts about projects, experiments, and learnings." />
</svelte:head>

<ContentLayout>
	{#snippet sidebar()}
		<section class="text-gray-100 bg-custom-black" in:fade={{ duration: 350 }}>
			<div class="container mx-auto relative">
				<div class="flex flex-col gap-3">
					Well how about that. you've made it to the blog
				</div>
			</div>
		</section>
	{/snippet}

	<section class="flex flex-col gap-8 pb-16">
		<hr class="border-t border-gray-500 md:hidden" />
		<div class="grid md:grid-flow-row-dense grid-cols-2 gap-2 mx-auto place-items-center">
			{#each data.blogPosts as post}
				<BlogPostCard blogPost={post} />
			{/each}
		</div>
	</section>
</ContentLayout>
