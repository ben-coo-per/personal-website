<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';
	import { urlFor } from '$lib/utils/image';

	export let data: PageData;
	const { project, next } = data;

	const IMG_WIDTH = 2000;
</script>

<section class="text-white p-6 bg-gray-700 overflow-auto" in:fade={{ duration: 350 }}>
	<div class="container mx-auto relative">
		<div class="relative z-10 md:h-screen">
			<h1 class="text-6xl font-serif font-bold">{project.title}</h1>
			<h3 class="text-2xl font-sans">{project.subtitle}</h3>
			<p class="mt-6 text-md md:w-1/3 lg:w-1/2">{project.mainDescription}</p>
			{#if project.mainImage}
				<img
					class="md:absolute top-0 left-0"
					src={urlFor(project.mainImage).width(IMG_WIDTH).url()}
					alt={project.title}
				/>
			{/if}
		</div>

		<div class="text-center mb-60">
			{#each project.gallery as item}
				{#if item._type === 'image'}
					<img class="w-full my-6" src={urlFor(item).width(IMG_WIDTH).url()} alt="product" />
				{:else if item.text}
					<p class="text-lg my-6">{item.text}</p>
				{/if}
			{/each}
		</div>
	</div>
</section>

<!-- Scrolling past routes to next project -->
