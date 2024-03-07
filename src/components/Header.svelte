<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';

	export let backHeader: boolean;
</script>

{#if backHeader}
	<header
		class="w-full bg-black text-white font-serif flex justify-between p-6 border-b border-white"
		in:fade
	>
		<button class="text-xl" on:click={() => (browser ? window.history.back() : () => {})}
			>&larr; Back</button
		>
		<div class="flex gap-4">
			<slot />
		</div>
	</header>
{:else}
	<header
		class="w-full bg-black text-white font-serif flex justify-between p-6 border-b border-white"
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
