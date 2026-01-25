<script lang="ts">
	import type { BlogPostMetadata } from '$lib/types';
	import { formatDate } from '$lib/utils/format';

	interface Props {
		blogPost: BlogPostMetadata;
	}

	let { blogPost }: Props = $props();
</script>

<a
	href="/blog/{blogPost.slug}"
	class={`group flex flex-col w-full h-full relative text-left bg-repeat bg-custom-black border-custom-black shadow-2xl border-2 bg-opacity-0 transition-all duration-300 cursor-pointer hover:border-amber-500 hover:-mt-1 hover:mb-1`}
>
	<div class="text-gray-100 p-6 bg-blur bg-custom-black bg-opacity-75 rounded pointer-events-none">
		<h2 class="mb-2 text-xl font-display text-gray-100">{blogPost.title}</h2>
		<p class="mb-3 text-sm text-gray-400">{formatDate(blogPost.publishedAt)}</p>
		<p class="text-gray-300">{blogPost.excerpt}</p>
	</div>
</a>

<!-- class="block h-full rounded-lg border border-gray-700 bg-gray-900 p-6 transition-colors hover:border-amber-500 hover:bg-gray-800" -->
