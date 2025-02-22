<script>
	import '../app.css';
	import Header from '../components/Header.svelte';
	import Footer from '../components/Footer.svelte';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';

	if (!dev) {
		inject({ mode: 'production' });
	}

	import { page } from '$app/stores';

	$: backHeader = $page.url.pathname.includes('/project/');
</script>

<Header {backHeader} />
<div class="mx-auto overflow-auto flex flex-col">
	<main class="h-full container max-w-6xl mx-auto">
		<slot />
	</main>
	<Footer />
</div>
