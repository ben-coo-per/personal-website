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

		const items = [{ label: '~', href: '/' }];

		let currentPath = '';
		segments.forEach((segment, index) => {
			currentPath += `/${segment}`;
			const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
			const isLast = index === segments.length - 1;

			items.push({
				label,
				href: currentPath
			});
		});

		return items;
	});
</script>

<header
	class="sticky top-0 inset-x-0 w-full bg-custom-black text-gray-100 font-mono flex justify-between items-center px-5 py-2 z-50"
	in:fade|global
>
	<nav class="text-sm text-gray-400">
		{#each breadcrumbs() as crumb, i}
			{#if i > 0}
				<span class="mx-2">/</span>
			{/if}
			{#if i < breadcrumbs().length - 1}
				<a href={crumb.href} class="hover:text-amber-300">{crumb.label}</a>
			{:else}
				<span class="text-gray-300">{crumb.label}</span>
			{/if}
		{/each}
	</nav>
	<div class="flex gap-4">
		{@render children?.()}
	</div>
</header>
