<script lang="ts">
	import type { PageData } from './$types';
	import { marked } from 'marked';
	import { ditherImages } from '$lib/actions/ditherImages';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const renderedContent = $derived(marked.parse(data.content));
</script>

<svelte:head>
	<title>{data.blogPost.title} – Ben Cooper</title>
	<meta name="description" content={data.blogPost.excerpt} />
</svelte:head>

<!-- article-body is a global class from app.css -->
<div class="article-body" use:ditherImages>
	{@html renderedContent}
</div>
