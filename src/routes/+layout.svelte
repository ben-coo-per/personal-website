<script>
	import '../app.css';
	import Header from '../components/Header.svelte';

	import { page } from '$app/stores';

	$: backHeader = $page.url.pathname.includes('/project/');
</script>

<div class="bg-black h-screen overflow-hidden">
	<Header {backHeader} />
	<main class="overflow-auto h-full">
		<slot />
		<footer class="footer" />
	</main>
</div>
