<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';

	export let backHeader: boolean;

	function goBack() {
		goto('/');
	}
</script>

{#if backHeader}
	<header
		class="sticky top-0 inset-x-0 w-full bg-custom-black text-gray-100 font-serif flex justify-between py-4 px-2 sm:p-6 border-b border-gray-500 z-50"
		in:fade|global
	>
		<button class="text-xl hover:text-gray-400" on:click={goBack}>&larr; Back</button>
		<div class="flex gap-4">
			<slot />
		</div>
	</header>
{:else}
	<header
		class="sticky top-0 inset-x-0 w-full bg-custom-black text-gray-100 font-serif flex justify-between py-4 px-2 sm:p-6 border-b border-gray-500 z-50"
		in:fade|global
	>
		<a href="/" class="hover:text-gray-400">
			<h3 class="text-lg sm:text-xl">Ben Cooper</h3>
		</a>
		<div class="text-sm md:text-lg flex gap-4 items-center">
			<a href="/" class="hover:text-gray-400" class:active={$page.url.pathname === '/'}>Portfolio</a
			>
			<a href="/about" class="hover:text-gray-400" class:active={$page.url.pathname === '/about'}
				>About</a
			>
			<a
				href="/contact"
				class="hover:text-gray-400"
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
