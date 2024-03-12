<script lang="ts">
	import { fade } from 'svelte/transition';

	// uses portable text to render the about page body content
	import type { PageData } from './$types';
	export let data: PageData;

	import { PortableText } from '@portabletext/svelte';
</script>

<section class="text-white p-6 bg-gray-700 h-screen" in:fade={{ duration: 350 }}>
	<div class="container mx-auto relative">
		<h1 class="text-6xl font-serif font-bold">About</h1>
		<div class="text-xl mt-6">
			<PortableText value={data.about.body} components={{}} />
		</div>
	</div>
</section>
