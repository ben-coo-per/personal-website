<script lang="ts">
	import { urlFor } from '$lib/utils/image';
	import type { Project } from '$lib/utils/sanity';
	import { fade } from 'svelte/transition';

	export let project: Project;
	$: projectBGImage = project.previewImage
		? urlFor(project.previewImage).width(1080).height(1080).url()
		: null;

	let hovering: boolean = false;

	const gotoProject = () => {
		window.location.href = `/project/${project.slug.current}`;
	};

	// shadow color cycles
	const shadowColors = ['shadow-amber-500', 'shadow-yellow-500'];
	let shadowColor = 0;

	const cycleShadowColor = () => {
		shadowColor = shadowColor === shadowColors.length - 1 ? 0 : shadowColor + 1;
	};
	setInterval(cycleShadowColor, 700);
</script>

<!-- I still want the card images to be preloaded so I'm going to handle that here -->
<img class="hidden" src={projectBGImage} alt="" />
<button
	class={`group flex flex-col w-full h-full relative text-left bg-repeat bg-custom-black  border-gray-500 border-2 bg-opacity-0 transition-all cursor-pointer ${shadowColors[shadowColor]} `}
	on:click={gotoProject}
	on:mouseenter={() => (hovering = true)}
	on:mouseleave={() => (hovering = false)}
	class:-mt-1={hovering}
	class:mb-1={hovering}
	class:shadow-2xl={hovering}
	class:border-amber-100={hovering}
>
	{#if projectBGImage}
		<div
			in:fade|global={{ duration: 500 }}
			out:fade|global={{ duration: 150 }}
			class="bg-auto bg-center opacity-60 h-3/4 min-h-40 w-full"
			style="background-image: url({projectBGImage})"
			class:opacity-0={hovering}
		/>
	{:else}
		<div
			in:fade|global={{ duration: 350 }}
			class="bg-repeat bg-gradient-to-r from-pink-500 to-cyan-600 opacity-50"
			class:opacity-100={hovering}
		/>
	{/if}

	<div class="text-gray-100 p-6 bg-blur bg-custom-black bg-opacity-75 rounded pointer-events-none">
		<h3 class="text-md">{project.date.getFullYear() || ''}</h3>
		<h4 class="text-2xl md:text-4xl font-display" class:text-yellow-200={hovering}>
			{project.title}
		</h4>
		<h3 class="text-md">{project.subtitle || ''}</h3>
	</div>
</button>
