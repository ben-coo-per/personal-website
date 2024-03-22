<script>
	import '../app.css';
	import Header from '../components/Header.svelte';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';

	if (!dev) {
		inject({ mode: 'production' });
	}

	import { page } from '$app/stores';

	$: backHeader = $page.url.pathname.includes('/project/');
</script>

<div class="bg-custom-black">
	<div class="container mx-auto">
		<Header {backHeader} />
		<main class="h-full overflow-auto">
			<slot />
			<footer class="footer" />
		</main>
	</div>
</div>
