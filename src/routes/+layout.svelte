<script lang="ts">
	import '../app.css';
	import Header from '../components/Header.svelte';
	import Footer from '../components/Footer.svelte';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';

	if (!dev) {
		inject({ mode: 'production' });
	}

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<svelte:head>
	<title>Ben Cooper – Portfolio</title>
	<meta
		name="description"
		content="Creative developer, designer, and more. Explore my projects and blog."
	/>
	<!-- Open Graph -->
	<meta property="og:title" content="Ben Cooper – Portfolio" />
	<meta
		property="og:description"
		content="Creative developer, designer, and more. Explore my projects and blog."
	/>
	<meta property="og:image" content="https://bencooper.xyz/static/android-chrome-192x192.png" />
	<meta property="og:url" content="https://bencooper.xyz/" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Ben Cooper" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Ben Cooper – Portfolio" />
	<meta
		name="twitter:description"
		content="Creative developer, designer, and more. Explore my projects and blog."
	/>
	<meta name="twitter:image" content="https://bencooper.xyz/static/android-chrome-192x192.png" />
	<meta name="twitter:site" content="@ben_coo_per" />
	<!-- Favicon & theme color -->
	<link rel="icon" href="/static/favicon.ico" />
	<meta name="theme-color" content="#000000" />
</svelte:head>

<div class="overflow-auto flex flex-col text-gray-200">
	<div class="fixed top-0 w-full z-50 hidden md:block">
		<Header />
	</div>
	<main class="h-full">
		{@render children?.()}
	</main>
	<div class="block md:hidden">
		<Footer />
	</div>
</div>
