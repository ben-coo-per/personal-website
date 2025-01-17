<script lang="ts">
	import Card from '../components/Card.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="flex flex-col gap-4 py-10">
	<h1 class="text-4xl font-display font-bold text-white opacity-50 text-left">Selected Projects</h1>
	<div class="flex flex-wrap gap-0 mx-auto place-items-center">
		{#each data.projects as project}
			<div class="w-1/4 h-72 p-1">
				<Card {project} />
			</div>
		{/each}
		<a
			class="group block w-1/4 h-72 border-b relative text-left border-gray-500 px-6 py-12 bg-repeat bg-custom-black bg-opacity-0 transition-all cursor-pointer group"
			href="https://blog.bencooper.xyz/"
			target="_blank"
		>
			<div
				class="text-gray-400 flex flex-col gap-1 relative z-20 p-4 -m-4 bg-blur bg-custom-black bg-opacity-75 rounded pointer-events-none"
			>
				<h4 class="text-md font-display group-hover:text-yellow-200">Little Projects ⤴</h4>
				<h3 class="text-2xl">Additional smaller projects can be found on my blog</h3>
			</div>
		</a>
	</div>
</div>
