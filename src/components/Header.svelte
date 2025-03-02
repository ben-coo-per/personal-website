<script lang="ts">
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';

	interface Props {
		backHeader: boolean;
		children?: import('svelte').Snippet;
	}

	let { backHeader, children }: Props = $props();

	function goBack() {
		goto('/');
	}
</script>

{#if backHeader}
	<header
		class="sticky top-0 inset-x-0 w-full bg-custom-black text-gray-100 font-display flex justify-between p-4 sm:p-6 border-b border-gray-500 z-50"
		in:fade|global
	>
		<button
			class="text-lg sm:text-2xl text-gray-200 sm:hover:text-amber-200 cursor-pointer"
			onclick={goBack}>&larr; Back</button
		>
		<div class="flex gap-4">
			{@render children?.()}
		</div>
	</header>
{:else}
	<header
		class="md:hidden sticky top-0 inset-x-0 w-full bg-custom-black text-gray-100 font-display flex justify-between p-4 sm:p-6 border-b border-gray-500 z-50"
		in:fade|global
	>
		<a href="/" class="sm:hover:text-amber-200">
			<h3 class="hidden sm:block text-3xl">Ben Cooper</h3>
			<h3 class="block sm:hidden text-3xl">BC</h3>
		</a>
		<div class="text-md md:text-lg flex gap-3 sm:gap-4 items-center">
			<a
				href="/"
				class="sm:hover:text-amber-200 cursor-pointer"
				class:text-amber-300={$page.url.pathname === '/'}>Projects</a
			>
			<a
				href="/contact"
				class="sm:hover:text-amber-200 cursor-pointer"
				class:text-amber-300={$page.url.pathname === '/contact'}
			>
				Contact
			</a>
			<a
				href="https://blog.bencooper.xyz/"
				target="_blank"
				class="sm:hover:text-amber-200 cursor-pointer"
			>
				Blog ⤴
			</a>
		</div>
	</header>
{/if}
