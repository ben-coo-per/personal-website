<script lang="ts">
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// Generate breadcrumb items from current path
	const breadcrumbs = $derived(() => {
		const path = $page.url.pathname;
		const segments = path.split('/').filter(Boolean);

		const items: { label: string; href: string }[] = [];

		let currentPath = '';
		segments.forEach((segment) => {
			currentPath += `/${segment}`;
			items.push({
				label: segment,
				href: currentPath
			});
		});

		return items;
	});
</script>

<header
	class="sticky top-0 inset-x-0 w-full bg-custom-black font-mono flex justify-between items-center px-4 py-2 z-50"
	in:fade|global
>
	<nav class="text-xs text-gray-500 flex items-center gap-1">
		<a href="/" class="hover:text-amber-300 transition-colors">~</a>
		{#each breadcrumbs() as crumb, i}
			<span>/</span>
			{#if i < breadcrumbs().length - 1}
				<a href={crumb.href} class="hover:text-amber-300 transition-colors">{crumb.label}</a>
			{:else}
				<span class="text-gray-300">{crumb.label}</span>
			{/if}
		{/each}
	</nav>
	<div class="flex gap-4">
		{@render children?.()}
	</div>
</header>
