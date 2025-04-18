<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';
	import { urlFor } from '$lib/utils/image';
	import NextProjectCard from '../../../components/NextProjectCard.svelte';
	import '@mux/mux-player';

	import { inView } from 'motion';
	import { onMount } from 'svelte';

	let IMG_WIDTH = $state(2000);
	let MAIN_IMG_WIDTH = $state(2000);
	let scrollY: number = $state();
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let atBottom = $state(false);

	onMount(() => {
		IMG_WIDTH = Math.round(window.outerWidth);
		MAIN_IMG_WIDTH = Math.round(window.outerWidth);

		inView('#next-project', () => {
			atBottom = true;
		});
	});

	const isImage = (item: any) => item._type === 'image';
	const isVideo = (item: any) => item._type === 'video';
	const isBlurb = (item: any) => 'text' in item;
	let project = $derived(data.project);
	let next = $derived(data.next);
</script>

<svelte:window bind:scrollY />
<section class="text-gray-100 p-6 bg-custom-black" in:fade|global={{ duration: 350 }}>
	<div class="container mx-auto relative">
		{#if project.gallery}
			<div class="md:h-screen">
				<h4 class="text-md font-sans">{project.date.getFullYear()}</h4>
				<h1 class="text-6xl font-display font-bold relative z-10">{project.title}</h1>
				<h3
					class="text-2xl md:text-3xl text-gray-200 font-sans md:w-min md:whitespace-nowrap md:pr-4 rounded-xl relative bg-custom-black bg-opacity-50 z-10"
				>
					{project.subtitle}
				</h3>
				<p
					class="font-sans font-light mt-6 text-md text-gray-200 md:text-2xl md:w-1/3 lg:w-1/2 py-2 relative bg-custom-black rounded-xl bg-opacity-50 z-10"
				>
					{project.mainDescription}
				</p>
				{#if project.mainImage}
					<img
						class="md:absolute top-2 md:-top-4 right-0 md:w-2/3"
						src={urlFor(project.mainImage).width(MAIN_IMG_WIDTH).url()}
						alt={project.title}
						style="transform: translate(0, {scrollY / 8}px)"
					/>
				{/if}
			</div>

			<div class="text-center mb-60 relative z-10 max-w-3xl mx-auto">
				{#each project.gallery as item}
					{#if isImage(item)}
						<img class="w-full my-6" src={urlFor(item).width(IMG_WIDTH).url()} alt="product" />
					{:else if isVideo(item)}
						{#if isVideo(item) && 'muxPlaybackId' in item}
							<mux-player
								class="w-full my-6"
								style="--controls-background-color: rgba(0, 0, 0, 0.8);"
								stream-type="on-demand"
								playback-id={item.muxPlaybackId}
								poster={`https://image.mux.com/${item.muxPlaybackId}/thumbnail.jpg`}
								metadata-video-title={project.title}
								metadata-video-id={item.muxAssetId}
								controls
							></mux-player>
						{:else}
							<p class="text-red-500">Video playback data not available</p>
						{/if}
					{:else if isBlurb(item)}
						<p
							class="text-lg font-thin font-sans md:text-2xl my-6 py-2 bg-custom-black bg-opacity-50"
						>
							{item.text}
						</p>
					{/if}
				{/each}
			</div>
		{:else}
			<div class="h-screen">
				<h1 class="text-4xl md:text-6xl font-display font-bold">{project.title}</h1>
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
						class="text-5xl md:text-7xl text-center font-display font-extrabold bg-clip-text py-6 text-transparent bg-[linear-gradient(to_right,theme(colors.purple.400),theme(colors.purple.100),theme(colors.pink.300),theme(colors.orange.400),theme(colors.pink.300),theme(colors.purple.100),theme(colors.purple.400))] bg-[length:200%_auto] animate-gradient"
					>
						Coming Soon
					</p>
				</div>
			</div>
		{/if}
	</div>
</section>

<div id="next-project" class="text-gray-100">
	<h3 class="text-2xl font-sans p-6">Next Project:</h3>
	<NextProjectCard project={next} scrollTransition={atBottom} />
</div>
