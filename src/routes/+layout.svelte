<script>
	import '../app.css';

	import Header from '../components/Header.svelte';
</script>

<div class="bg-black h-screen overflow-hidden">
	<Header />
	<main class="overflow-auto h-full">
		<slot />
		<footer class="footer" />
	</main>
</div>
