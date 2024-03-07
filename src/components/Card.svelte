<script lang="ts">
	import { urlFor } from '$lib/utils/image';
	import type { Project } from '$lib/utils/sanity';
	import { fade } from 'svelte/transition';

	export let project: Project;
	const projectBGImage = project.previewImage
		? urlFor(project.previewImage).width(450).height(200).url()
		: null;

	let hovering: boolean = false;
</script>

<a
	class="group block w-full border-y relative border-white px-6 py-12 bg-repeat hover:bg-black bg-opacity-0"
	href={`/project/${project.slug.current}`}
	on:mouseenter={() => (hovering = true)}
	on:mouseleave={() => (hovering = false)}
>
	<div class="text-white flex flex-col gap-1 relative z-20">
		<h4 class="text-sm font-serif">
			{project.title}
		</h4>
		<h3 class="text-2xl">{project.subtitle || ''}</h3>
	</div>
	{#if hovering}
		<div
			class="absolute inset-0 z-10 opacity-60 bg-gradient-to-r from-black from-50% to-transparent"
		/>
		{#if projectBGImage}
			<div
				transition:fade
				class="absolute inset-0 bg-repeat"
				style="background-image: url({projectBGImage})"
			/>
		{:else}
			<div
				transition:fade
				class="absolute inset-0 bg-repeat bg-gradient-to-r from-pink-500 to-cyan-600"
			/>
		{/if}
	{/if}
</a>
