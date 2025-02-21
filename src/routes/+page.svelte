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
			if (ps.words) {
				animate(
					ps.words,
					{
						opacity: [0.75, 1]
					},
					{ duration: 0.2, delay: stagger(0.1) }
				);
			}
		});
		hasViewed.set(true);

		setInterval(() => {
			selectedDownArrow = getRandomDownArrow();
		}, 2000);
	});

	const twoColumnIndices = [0, 3, 8, 9, 12, 16];
	const twoRowIndices = [1, 3, 6, 10, 13, 16, 17];
</script>

<div class="p-4 md:px-0 md:pt-20 h-5/6 flex flex-col justify-between">
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
	<hr class="border-t border-gray-500" />
	<h1 class="text-3xl md:text-5xl font-display font-bold text-white opacity-75 text-center">
		{selectedDownArrow} Selected Projects {selectedDownArrow}
	</h1>
</div>
<div class="flex flex-col gap-32 py-16">
	<div class="grid md:grid-flow-row-dense grid-cols-1 gap-2 mx-auto place-items-center">
		{#each data.projects as project, i}
			<div
				class="h-full p-1 w-full"
				class:md:col-span-2={twoColumnIndices.includes(i)}
				class:md:row-span-2={twoRowIndices.includes(i)}
			>
				<Card {project} />
			</div>
		{/each}
		<div class="h-full p-1">
			<a
				class="group w-full h-full relative text-left px-6 py-12 bg-repeat bg-custom-black bg-opacity-0 transition-all cursor-pointer grid place-content-center border-gray-500 border-2 hover:border-amber-500 hover:border-opacity-75"
				href="https://blog.bencooper.xyz/"
				target="_blank"
			>
				<div
					class="text-gray-400 group-hover:text-yellow-200 flex flex-col justify-center gap-1 bg-custom-black pointer-events-none"
				>
					<h4 class="text-md font-display">Little Projects ⤴</h4>
					<h3 class="text-2xl">Additional smaller projects can be found on my blog</h3>
				</div>
			</a>
		</div>
	</div>
</div>
