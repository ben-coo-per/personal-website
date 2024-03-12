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
		class="sticky top-0 inset-x-0 w-full bg-black text-white font-serif flex justify-between p-6 border-b border-white z-50"
		in:fade
	>
		<button class="text-xl" on:click={goBack}>&larr; Back</button>
		<div class="flex gap-4">
			<slot />
		</div>
	</header>
{:else}
	<header
		class="sticky top-0 inset-x-0 w-full bg-black text-white font-serif flex justify-between p-6 border-b border-white z-50"
		in:fade
	>
		<h3 class="text-xl">Ben Cooper</h3>
		<div class="flex gap-4">
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
