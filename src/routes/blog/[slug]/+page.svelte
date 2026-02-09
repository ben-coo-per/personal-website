<script lang="ts">
	import type { PageData } from './$types';
	import { marked } from 'marked';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const renderedContent = $derived(marked.parse(data.content));
</script>

<svelte:head>
	<title>{data.blogPost.title} - Ben Cooper</title>
	<meta name="description" content={data.blogPost.excerpt} />
</svelte:head>

<article class="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-xl">
	{@html renderedContent}
</article>
