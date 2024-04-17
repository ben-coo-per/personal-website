<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';

	import { animate, stagger } from 'motion';
	import SplitType from 'split-type';
	import { onMount } from 'svelte';
	import { hasViewed } from './page.config';
	export let data: PageData;

	const paragraphs = data.about.body.map((block, i) => {
		return {
			id: i,
			text: block.children
				.map((child) => {
					return child.text;
				})
				.join(' ')
		};
	});

	onMount(() => {
		hasViewed.subscribe((viewed) => {
			if (viewed) return;
			const ps = new SplitType('.about-text', { types: 'words' });
			animate(
				ps.words,
				{
					opacity: [0, 1]
				},
				{ duration: 0.5, delay: stagger(0.1) }
			);
		});
		hasViewed.set(true);
	});
</script>

<section class="text-gray-100 p-6 bg-custom-black" in:fade|global={{ duration: 350 }}>
	<div class="container mx-auto relative pb-48">
		<h1 class="text-6xl font-display font-bold">About</h1>
		<div class="mt-6 flex flex-col gap-3">
			{#each paragraphs as { id, text }}
				<div class=" pb-10">
					<p class="text-2xl text-gray-200 about-text" id={`${id}`}>{text}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
