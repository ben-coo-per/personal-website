<script lang="ts">
	import { urlFor } from '$lib/utils/image';
	import type { Project } from '$lib/utils/sanity';
	import { fade } from 'svelte/transition';

	export let project: Project;
	$: projectBGImage = project.previewImage
		? urlFor(project.previewImage).width(320).height(320).url()
		: null;

	let hovering: boolean = false;

	const gotoProject = () => {
		window.location.href = `/project/${project.slug.current}`;
	};
</script>

<!-- I still want the card images to be preloaded so I'm going to handle that here -->
<img class="hidden" src={projectBGImage} alt="" />
<button
	class="group block w-full h-72 border-b relative text-left border-gray-500 px-6 py-12 bg-repeat bg-custom-black bg-opacity-0 transition-all cursor-pointer"
	on:click={gotoProject}
	on:mouseenter={() => (hovering = true)}
	on:mouseleave={() => (hovering = false)}
>
	<div
		class="text-gray-100 flex flex-col gap-1 relative z-20 p-4 -m-4 bg-blur bg-custom-black bg-opacity-75 rounded pointer-events-none"
	>
		<h4 class="text-md font-display" class:text-yellow-200={hovering}>
			{project.title}
		</h4>
		<h3 class="text-2xl">{project.subtitle || ''}</h3>
	</div>
	{#if hovering}
		{#if projectBGImage}
			<div
				in:fade|global={{ duration: 350 }}
				class="absolute inset-0 bg-repeat"
				style="background-image: url({projectBGImage})"
			/>
		{:else}
			<div
				in:fade|global={{ duration: 350 }}
				class="absolute inset-0 bg-repeat bg-gradient-to-r from-pink-500 to-cyan-600"
			/>
		{/if}
	{/if}
</button>
