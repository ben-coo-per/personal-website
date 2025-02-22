<script lang="ts">
	import { IconExternalLink, IconEye } from '@tabler/icons-svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		shown: boolean;
		show: () => void;
		value: string;
		link: string;
		isExternal?: boolean;
		children?: import('svelte').Snippet;
	}

	let {
		shown,
		show,
		value,
		link,
		isExternal = true,
		children
	}: Props = $props();

	// max length is 15
	const fakeValueOfSameLength = value.replace(/./g, 'x').slice(0, 15);
</script>

<div class="text-md flex flex-row justify-between items-center">
	<!-- NOTE: Branding icon should be added in the slot in the parent component -->
	<div class="flex flex-row gap-2 items-center p-2 w-full">
		{@render children?.()}
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
	</div>
</div>
