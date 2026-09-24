<script lang="ts">
	import '../app.css';
	import Header from '../components/Header.svelte';
	import Footer from '../components/Footer.svelte';
	import CmdK from '../components/CmdK.svelte';
	import DitherBackground from '../components/DitherBackground.svelte';
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import { inject } from '@vercel/analytics';
	import { AUTHOR, OG_IMAGE, PERSON_JSON_LD, SITE_NAME, resolveSeo } from '$lib/seo';
	import type { LayoutData } from './$types';

	if (!dev) {
		inject({ mode: 'production' });
	}

	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	const seo = $derived(resolveSeo($page));
	// /projects is the effective home (/ redirects there).
	const showPerson = $derived($page.route.id === '/projects' || $page.route.id === '/about');
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<meta name="author" content={AUTHOR} />
	<link rel="canonical" href={seo.canonical} />
	{#if seo.noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
	<!-- Open Graph -->
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:image" content={OG_IMAGE} />
	<meta property="og:url" content={seo.canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	<meta name="twitter:image" content={OG_IMAGE} />
	<meta name="twitter:site" content="@ben_coo_per" />
	<!-- Favicon & theme color -->
	<meta name="theme-color" content="#0a0a0b" />
	{#if showPerson}
		{@html `<script type="application/ld+json">${PERSON_JSON_LD}</script>`}
	{/if}
</svelte:head>

<DitherBackground />

<div class="layout">
	<Header />
	<main>
		{@render children?.()}
	</main>
	<Footer />
</div>

<CmdK projects={data.projects} />

<style>
	.layout {
		position: relative;
		z-index: 1;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	main {
		flex: 1;
	}
</style>
