<script lang="ts">
	import StatusEntry from '../../../components/StatusEntry.svelte';
	import { formatStatusTime } from '$lib/utils/format';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const post = $derived(data.post);
	const url = $derived(`https://www.bencooper.xyz/status/${post.slug}`);
	const description = $derived(post.text.slice(0, 200) || 'A status update from Ben Cooper.');
	const ogTitle = $derived(`Ben Cooper · ${formatStatusTime(post.publishedAt)}`);
	const ogImage = $derived(
		post.images[0] ? `https://www.bencooper.xyz${post.images[0].url}` : 'https://bencooper.xyz/og-card.png'
	);
</script>

<svelte:head>
	<title>{ogTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:url" content={url} />
	<meta property="og:type" content="article" />
	<meta name="twitter:title" content={ogTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<div class="site">
	<div class="head">
		<a class="back" href="/about">← all updates</a>
		<span class="label">/ status</span>
	</div>

	<div class="single">
		<StatusEntry {post} standalone />
	</div>
</div>

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 28px 6px 18px;
		border-bottom: 1px solid var(--rule);
		margin-bottom: 32px;
	}

	.single {
		max-width: 860px;
		margin: 0 auto;
		padding: 0 6px;
	}

	.single :global(.grid) {
		max-width: none;
	}
</style>
