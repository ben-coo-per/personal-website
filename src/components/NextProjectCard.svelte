<script lang="ts">
	import { urlFor } from '$lib/utils/image';
	import type { Project } from '$lib/utils/sanity';
	import { fade } from 'svelte/transition';

	export let project: Project;
	$: projectBGImage = project.previewImage
		? urlFor(project.previewImage).width(800).height(800).url()
		: null;

	let hovering: boolean = false;
	export let scrollTransition: boolean = false;

	const gotoProject = () => {
		window.location.href = `/project/${project.slug.current}`;
	};
</script>

<!-- I still want the card images to be preloaded so I'm going to handle that here -->
<img class="hidden" src={projectBGImage} alt="" />
<button
	class="group block w-full border-b relative text-left border-gray-500 px-6 py-12 hover:text-yellow-200 bg-custom-black bg-opacity-0 transition-all"
	class:py-40={scrollTransition}
	class:border-t={scrollTransition}
	on:click={gotoProject}
	on:mouseenter={() => (hovering = true)}
	on:mouseleave={() => (hovering = false)}
>
	<div class="text-gray-100 flex flex-col gap-1 relative z-20" class:text-white={hovering}>
		<h3 class="text-md">{project.date.getFullYear() || ''}</h3>
		<h4 class="text-4xl font-display">
			{project.title}
		</h4>
		<h3 class="text-2xl">{project.subtitle || ''}</h3>
	</div>
	{#if hovering || scrollTransition}
		<div
			class="absolute inset-0 z-10 bg-gradient-to-r from-custom-black from-5% via-transparent via-80% to-custom-black to-98%"
		/>
		{#if projectBGImage}
			<div
				in:fade|global={{ duration: 1500 }}
				class="absolute inset-0 bg-cover bg-center"
				style="background-image: url({projectBGImage})"
			/>
		{:else}
			<div
				in:fade|global={{ duration: 1500 }}
				class="absolute inset-0 bg-repeat bg-gradient-to-r from-pink-500 to-cyan-600"
			/>
		{/if}
	{/if}
</button>
