<script lang="ts">
	import { urlFor } from '$lib/utils/image';
	import type { Project } from '$lib/utils/sanity';
	import { fade } from 'svelte/transition';

	interface Props {
		project: Project;
	}

	let { project }: Props = $props();
	let projectBGImage = $derived(
		project.previewImage ? urlFor(project.previewImage).width(1080).height(1080).url() : null
	);

	const gotoProject = () => {
		window.location.href = `/project/${project.slug.current}`;
	};
</script>

<!-- I still want the card images to be preloaded so I'm going to handle that here -->
<img class="hidden" src={projectBGImage} alt="" />
<button
	class={`group flex flex-col w-full h-full relative text-left bg-repeat bg-custom-black border-custom-black shadow-2xl border-2 bg-opacity-0 transition-all duration-300 cursor-pointer hover:border-amber-500 hover:-mt-1 hover:mb-1`}
	onclick={gotoProject}
>
	{#if projectBGImage}
		<div
			in:fade|global={{ duration: 500 }}
			out:fade|global={{ duration: 150 }}
			class="bg-cover bg-center opacity-60 min-h-64 h-full w-full group-hover:opacity-100 transition-all duration-300"
			style="background-image: url({projectBGImage})"
		></div>
	{:else}
		<div
			in:fade|global={{ duration: 350 }}
			class="bg-repeat bg-gradient-to-r from-pink-500 to-cyan-600 opacity-50 group-hover:opacity-100"
		></div>
	{/if}

	<div class="text-gray-100 p-6 bg-blur bg-custom-black bg-opacity-75 rounded pointer-events-none">
		<h3 class="text-md">{project.date.getFullYear() || ''}</h3>
		<h4 class="text-2xl md:text-3xl font-display group-hover:text-amber-300">
			{project.title}
		</h4>
		<h3 class="text-md">{project.subtitle || ''}</h3>
	</div>
</button>
