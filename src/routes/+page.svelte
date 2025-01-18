<script lang="ts">
	import Card from '../components/Card.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	import { fade } from 'svelte/transition';

	import { animate, stagger } from 'motion';
	import SplitType from 'split-type';
	import { onMount } from 'svelte';
	import { hasViewed } from './page.config';

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

	function getRandomDownArrow() {
		return downArrowOptions[Math.floor(Math.random() * downArrowOptions.length)];
	}

	let downArrowOptions = ['⇣', '👇', '↓', '↯', '⇊', '⇓'];
	let selectedDownArrow = getRandomDownArrow();

	onMount(() => {
		hasViewed.subscribe((viewed) => {
			if (viewed) return;
			const ps = new SplitType('.about-text', { types: 'words' });
			animate(
				ps.words,
				{
					opacity: [0, 1]
				},
				{ duration: 0.2, delay: stagger(0.1) }
			);
		});
		hasViewed.set(true);

		setInterval(() => {
			selectedDownArrow = getRandomDownArrow();
		}, 2000);
	});
</script>

<div class="py-20">
	<section class="text-gray-100 bg-custom-black" in:fade={{ duration: 350 }}>
		<div class="container mx-auto relative">
			<div class="mt-6 flex flex-col gap-3">
				{#each paragraphs as { id, text }}
					<div class="pb-20">
						<p class="text-3xl text-gray-200 about-text" id={`${id}`}>{text}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>
</div>
<hr class="border-t border-gray-500" />
<div class="flex flex-col gap-6 py-16">
	<h1 class="text-3xl md:text-5xl font-display font-bold text-white opacity-75 text-center">
		{selectedDownArrow} Selected Projects {selectedDownArrow}
	</h1>
	<div class="flex flex-wrap gap-x-0 gap-y-3 mx-auto place-items-center">
		{#each data.projects as project}
			<div class="md:w-1/4 w-full h-72 p-1">
				<Card {project} />
			</div>
		{/each}
		<div class="md:w-1/4 w-full h-full p-1">
			<a
				class="group w-full h-full relative text-left px-6 py-12 bg-repeat bg-custom-black bg-opacity-0 transition-all cursor-pointer grid place-content-center"
				href="https://blog.bencooper.xyz/"
				target="_blank"
			>
				<div
					class="text-gray-400 group-hover:text-yellow-200 flex flex-col gap-1 relative z-20 p-4 -m-4 bg-blur bg-custom-black bg-opacity-75 rounded pointer-events-none"
				>
					<h4 class="text-md font-display">Little Projects ⤴</h4>
					<h3 class="text-2xl">Additional smaller projects can be found on my blog</h3>
				</div>
			</a>
		</div>
	</div>
</div>
