<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';
	import { urlFor } from '$lib/utils/image';
	import Card from '../../../components/Card.svelte';
	$: project = data.project;
	$: next = data.next;
	import { inview } from 'svelte-inview';
	import { onMount } from 'svelte';

	let IMG_WIDTH = 2000;
	let MAIN_IMG_WIDTH = 2000;
	let scrollY: number;
	export let data: PageData;

	let atBottom = false;

	onMount(() => {
		IMG_WIDTH = Math.round(window.outerWidth);
		MAIN_IMG_WIDTH = Math.round(window.outerWidth);
	});
</script>

<svelte:window bind:scrollY />

<section class="text-white p-6 bg-gray-800" in:fade={{ duration: 350 }}>
	<div class="container mx-auto relative">
		{#if project.gallery}
			<div class="md:h-screen">
				<h1 class="text-6xl font-serif font-bold">{project.title}</h1>
				<h3 class="text-2xl font-sans">{project.subtitle}</h3>
				<p class="mt-6 text-md md:w-1/3 lg:w-1/2">{project.mainDescription}</p>
				{#if project.mainImage}
					<img
						class="md:absolute top-2 md:-top-4 right-0 md:w-2/3"
						src={urlFor(project.mainImage).width(MAIN_IMG_WIDTH).url()}
						alt={project.title}
						style="transform: translate(0,{scrollY / 8}px)"
					/>
				{/if}
			</div>

			<div class="text-center mb-60 relative z-10">
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
		{:else}
			<div class="h-screen">
				<h1 class="text-4xl md:text-6xl font-serif font-bold">{project.title}</h1>
				<h3 class="text-2xl font-sans">{project.subtitle}</h3>
				<p class="mt-6 text-md md:w-1/3 lg:w-1/2">{project.mainDescription || ''}</p>
				{#if project.mainImage}
					<img
						class="md:absolute top-2 md:-top-4 right-0 md:w-2/3"
						src={urlFor(project.mainImage).width(MAIN_IMG_WIDTH).url()}
						alt={project.title}
						style="transform: translate(0,{scrollY / 8}px)"
					/>
				{/if}
				<div class="w-full h-1/2 flex justify-center items-center">
					<p
						class="text-5xl md:text-7xl text-center font-serif font-extrabold bg-clip-text py-6 text-transparent bg-[linear-gradient(to_right,theme(colors.purple.400),theme(colors.purple.100),theme(colors.pink.300),theme(colors.orange.400),theme(colors.pink.300),theme(colors.purple.100),theme(colors.purple.400))] bg-[length:200%_auto] animate-gradient"
					>
						Coming Soon
					</p>
				</div>
			</div>
		{/if}
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
