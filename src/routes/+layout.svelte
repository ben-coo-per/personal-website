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

<div class="bg-custom-black h-screen">
	<div class="mx-auto overflow-auto flex flex-col h-full">
		<Header {backHeader} />
		<main class="h-full container mx-auto">
			<slot />
			<Footer />
		</main>
	</div>
</div>
