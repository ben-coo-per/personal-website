<script lang="ts">
	import { IconExternalLink, IconEye } from '@tabler/icons-svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		value: string;
		link: string;
		isExternal?: boolean;
		children?: import('svelte').Snippet;
	}

	let { value, link, isExternal = true, children }: Props = $props();
</script>

<div class="text-md flex flex-row justify-between items-center group hover:text-amber-400">
	<!-- NOTE: Branding icon should be added in the slot in the parent component -->
	<div class="flex flex-row gap-2 items-center py-1 w-full">
		{@render children?.()}
		<a
			href={link}
			class="flex flex-row gap-1 items-center text-xl sm:text-sm"
			target={isExternal ? '_blank' : '_self'}
			in:fade|global
		>
			{value}
			{#if isExternal}
				<IconExternalLink class="size-6 sm:size-4 text-gray-400 group-hover:text-amber-600" />
			{/if}
		</a>
	</div>
</div>
