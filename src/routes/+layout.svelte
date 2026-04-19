<script lang="ts">
	import '../app.css';
	import Header from '../components/Header.svelte';
	import Footer from '../components/Footer.svelte';
	import CmdK from '../components/CmdK.svelte';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import type { LayoutData } from './$types';

	if (!dev) {
		inject({ mode: 'production' });
	}

	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();
</script>

<svelte:head>
	<title>Ben Cooper – Portfolio</title>
	<meta name="description" content="Creative developer, designer, and more. Explore my projects and blog." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
	<!-- Open Graph -->
	<meta property="og:title" content="Ben Cooper – Portfolio" />
	<meta property="og:description" content="Creative developer, designer, and more. Explore my projects and blog." />
	<meta property="og:image" content="https://bencooper.xyz/static/android-chrome-192x192.png" />
	<meta property="og:url" content="https://bencooper.xyz/" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Ben Cooper" />
	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Ben Cooper – Portfolio" />
	<meta name="twitter:description" content="Creative developer, designer, and more. Explore my projects and blog." />
	<meta name="twitter:image" content="https://bencooper.xyz/static/android-chrome-192x192.png" />
	<meta name="twitter:site" content="@ben_coo_per" />
	<!-- Favicon & theme color -->
	<link rel="icon" href="/static/favicon.ico" />
	<meta name="theme-color" content="#0a0a0b" />
	{#if data.aiProfile}
		{@html `<!-- ${data.aiProfile} -->`}
	{/if}
</svelte:head>

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
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	main {
		flex: 1;
	}
</style>
