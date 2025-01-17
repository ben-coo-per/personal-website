<script lang="ts">
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';

	export let backHeader: boolean;

	function goBack() {
		goto('/');
	}
</script>

{#if backHeader}
	<header
		class="sticky top-0 inset-x-0 w-full bg-custom-black text-gray-100 font-display flex justify-between p-4 sm:p-6 border-b border-gray-500 z-50"
		in:fade|global
	>
		<button class="text-lg sm:text-2xl text-gray-200 sm:hover:text-yellow-200" on:click={goBack}
			>&larr; Back</button
		>
		<div class="flex gap-4">
			<slot />
		</div>
	</header>
{:else}
	<header
		class="sticky top-0 inset-x-0 w-full bg-custom-black text-gray-100 font-display flex justify-between p-4 sm:p-6 border-b border-gray-500 z-50"
		in:fade|global
	>
		<a href="/" class="sm:hover:text-yellow-200">
			<h3 class="hidden sm:block text-3xl">Ben Cooper</h3>
			<h3 class="block sm:hidden text-3xl">BC</h3>
		</a>
		<div class="text-md md:text-lg flex gap-3 sm:gap-4 items-center">
			<a href="/" class="sm:hover:text-yellow-200" class:active={$page.url.pathname === '/'}
				>Projects</a
			>
			<!-- <a
				href="/about"
				class="sm:hover:text-yellow-200"
				class:active={$page.url.pathname === '/about'}>About</a
			> -->
			<a href="https://blog.bencooper.xyz/" target="_blank" class="sm:hover:text-yellow-200">
				<small>little Projects ⤴</small>
			</a>
			<a
				href="/contact"
				class="sm:hover:text-yellow-200"
				class:active={$page.url.pathname === '/contact'}
			>
				Contact
			</a>
		</div>
	</header>
{/if}

<style lang="scss">
	.active {
		@apply font-bold underline underline-offset-4;
	}
</style>
