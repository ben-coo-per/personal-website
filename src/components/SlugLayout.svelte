<script lang="ts">
	import ContentLayout from './ContentLayout.svelte';

	interface Props {
		backHref: string;
		heading?: import('svelte').Snippet;
		sidebarContent?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let { backHref, heading, sidebarContent, children }: Props = $props();
</script>

<ContentLayout>
	{#snippet title()}
		<a href={backHref} class="text-sm text-gray-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 mb-4">&larr; Back</a>
		{#if heading}
			{@render heading()}
		{/if}
	{/snippet}

	{#snippet sidebar()}
		{#if sidebarContent}
			{@render sidebarContent()}
		{/if}
	{/snippet}

	{@render children?.()}
</ContentLayout>
