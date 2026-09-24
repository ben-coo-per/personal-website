<script lang="ts">
	import type { PageData } from './$types';
	import { marked } from '$lib/utils/markdown';
	import { ditherImages } from '$lib/actions/ditherImages';
	import { imageScrollers } from '$lib/actions/imageScrollers';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const renderedContent = $derived(marked.parse(data.content));
</script>

<!-- article-body is a global class from app.css -->
<div class="article-body" use:ditherImages use:imageScrollers>
	{@html renderedContent}
</div>
