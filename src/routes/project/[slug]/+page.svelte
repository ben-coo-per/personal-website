<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';
	import { urlFor } from '$lib/utils/image';
	import Card from '../../../components/Card.svelte';
	import { onDestroy, onMount } from 'svelte';
	export let data: PageData;
	const { project, next } = data;
	import { inview } from 'svelte-inview';
	const IMG_WIDTH = 2000;
	let scrollY: number;

	let atBottom = false;
</script>

<svelte:window bind:scrollY />

<section class="text-white p-6 bg-gray-700" in:fade={{ duration: 350 }}>
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
					style="transform: translate(0,{scrollY / 10}px)"
				/>
			{/if}
		</div>

		<div class="text-center mb-60">
			{#each project.gallery as item}
				{#if item._type === 'image'}
					<img class="w-full my-6" src={urlFor(item).width(IMG_WIDTH).url()} alt="product" />
				{:else if item.text}
					<p class="text-lg my-6">
						{item.text}
					</p>
				{/if}
			{/each}
		</div>
	</div>
</section>

<div
	class=" text-white"
	use:inview
	on:inview_change={(event) => {
		const { inView } = event.detail;
		atBottom = inView;
	}}
>
	<h3 class="text-2xl font-serif font-thin p-6">Next Project:</h3>
	<Card project={next} scrollTransition={atBottom} />
</div>
