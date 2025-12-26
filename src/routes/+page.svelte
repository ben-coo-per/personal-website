<script lang="ts">
	import Card from '../components/Card.svelte';
	import type { PageData } from './$types';

	import { fade } from 'svelte/transition';

	import SplitType from 'split-type';
	import { onMount } from 'svelte';
	import { hasViewed } from './page.config';
	import type { Project } from '$lib/utils/sanity';
	import ContactSection from '../components/ContactSection.svelte';
	import Footer from '../components/Footer.svelte';
	import PasswordEntry from '../components/PasswordEntry.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	type Paragraph = { id: number; text: string };
	const paragraphs: Paragraph[] = data.about.body.map((block, i) => {
		return {
			id: i,
			text: block.children
				.map((child) => {
					return child.text;
				})
				.join(' ')
		};
	});

	let restrictedAccess = data.restrictedAccess ?? false;

	onMount(() => {
		hasViewed.subscribe((viewed) => {
			if (viewed) return;
			const ps = new SplitType('.about-text', { types: 'words' });
		});
	});

	const twoColumnIndices = [0, 3, 7, 12, 16, 18, 19, 22, 25, 27];
	const twoRowIndices = [2, 6, 10, 13, 16, 17, 20, 22, 24, 27];

	async function handlePasswordSuccess() {
		// sets a flag for authenticated access
		await fetch('/api/set-restricted-access', { method: 'POST' });
		// reload the page to get new data from the server
		window.location.reload();
	}
</script>

<svelte:head>
	<title>Ben Cooper – Portfolio</title>
	<meta
		name="description"
		content="Creative developer, designer, and more. Explore my projects and blog."
	/>
</svelte:head>

{#snippet about(paragraphs: Paragraph[])}
	<section class="text-gray-100 bg-custom-black" in:fade={{ duration: 350 }}>
		<div class="container mx-auto relative">
			<div class="mt-6 md:mt-2 flex flex-col gap-3">
				{#each paragraphs as { id, text }}
					<div class="pb-6 md:pb-2">
						<p class="text-xl md:text-base text-gray-200 about-text" id={`${id}`}>{text}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>
{/snippet}

{#snippet projects(projects: Project[])}
	<section class="flex flex-col gap-8 pb-16 py-8">
		<hr class="border-t border-gray-500 md:hidden" />
		<div class="grid md:grid-flow-row-dense grid-cols-1 gap-2 mx-auto place-items-center">
			{#each projects as project, i}
				<div
					class="h-full p-1 w-full"
					class:lg:col-span-2={twoColumnIndices.includes(i)}
					class:lg:row-span-2={twoRowIndices.includes(i)}
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
						class="text-gray-400 group-hover:text-amber-300 flex flex-col justify-center gap-1 bg-custom-black pointer-events-none"
					>
						<h4 class="text-md font-display">Little Projects ⤴</h4>
						<h3 class="text-2xl">Additional smaller projects can be found on my blog</h3>
					</div>
				</a>
			</div>
		</div>
	</section>
{/snippet}

<div class="flex flex-col px-4 md:hidden">
	{@render about(paragraphs)}
	{#if !restrictedAccess}
		<PasswordEntry
			title="Some projects are confidential"
			label="If you were given a password, enter it here to show them."
			on:success={handlePasswordSuccess}
		/>
	{:else}
		<div class="text-gray-400 mt-4">
			<p class="text-sm">Access granted. You can now view confidential projects.</p>
		</div>
	{/if}
	{@render projects(data.projects)}
</div>

<div class="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-8 px-4 relative">
	<div class="col-span-2 lg:col-span-3">
		{@render projects(data.projects)}
	</div>
	<div class="fixed right-0 w-1/3 lg:w-1/4 py-8 h-full pr-4">
		<h3 class="text-gray-100 font-display block text-4xl mt-2">
			hi, I'm <i class="text-amber-400">Ben</i>
		</h3>
		{@render about(paragraphs)}
		<ContactSection />

		<div class="absolute bottom-0">
			{#if !restrictedAccess}
				<PasswordEntry
					title="Some projects are confidential"
					label="If you were given a password, enter it here to show them."
					on:success={handlePasswordSuccess}
				/>
			{:else}
				<div class="text-gray-400 mt-4">
					<p class="text-sm">Access granted. You can now view confidential projects.</p>
				</div>
			{/if}
			<Footer />
		</div>
	</div>
</div>
