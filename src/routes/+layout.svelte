<script>
	import '../app.css';
	import Header from '../components/Header.svelte';

	import { page } from '$app/stores';

	$: backHeader = $page.url.pathname.includes('/project/');
</script>

<div class="bg-black">
	<Header {backHeader} />
	<main class="h-full overflow-auto">
		<slot />
		<footer class="footer" />
	</main>
</div>
