<script lang="ts">
	import { IconExternalLink, IconEye } from '@tabler/icons-svelte';
	import { fade } from 'svelte/transition';

	export let shown: boolean;
	export let show: () => void;
	export let value: string;
	export let link: string;
	export let isExternal = true;

	// max length is 15
	const fakeValueOfSameLength = value.replace(/./g, 'x').slice(0, 15);
</script>

<div class="text-md flex flex-row justify-between items-center border-gray-100 border rounded-lg">
	<!-- NOTE: Branding icon should be added in the slot in the parent component -->
	<div class="flex flex-row gap-4 items-center p-4 sm:p-2 w-full">
		<slot />
		{#if !shown}
			<button
				on:click={show}
				class="w-full text-start motion-safe:animate-pulse blur-sm text-xl sm:text-md"
				>{fakeValueOfSameLength}</button
			>
		{:else}
			<a
				href={link}
				class="flex flex-row gap-1 items-center text-xl sm:text-md hover:text-gray-300"
				target={isExternal ? '_blank' : '_self'}
				in:fade|global
			>
				{value}
				{#if isExternal}
					<IconExternalLink size={16} class="text-gray-400" />
				{/if}
			</a>
		{/if}
	</div>
	{#if !shown}
		<button on:click={show} class="flex-1 border-l border-gray-200 p-4 sm:p-2" out:fade|global>
			<IconEye class="size-8 sm:size-6" />
		</button>
	{/if}
</div>
