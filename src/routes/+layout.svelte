<script lang="ts">
	import '../app.css';
	import Header from '../components/Header.svelte';
	import Footer from '../components/Footer.svelte';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';

	if (!dev) {
		inject({ mode: 'production' });
	}

	import { page } from '$app/stores';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let backHeader = $derived($page.url.pathname.includes('/project/'));
</script>

<Header {backHeader} />
<div class="overflow-auto flex flex-col">
	<main class="h-full mx-auto">
		{@render children?.()}
	</main>
	<div class="block md:hidden">
		<Footer />
	</div>
</div>
