<script lang="ts">
	import { page } from '$app/stores';
	import SlugLayout from '../../../components/SlugLayout.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let project = $derived($page.data.project);
</script>

{#if project}
	<SlugLayout backHref="/projects">
		{#snippet heading()}
			<h1 class="text-4xl font-display text-gray-100">{project.title}</h1>
			{#if project.subtitle}
				<p class="text-lg text-gray-400 mb-4">{project.subtitle}</p>
			{/if}
		{/snippet}

		{#snippet sidebarContent()}
			<p class="text-gray-300 text-sm leading-relaxed">{project.mainDescription}</p>
		{/snippet}

		{@render children?.()}
	</SlugLayout>
{:else}
	{@render children?.()}
{/if}
