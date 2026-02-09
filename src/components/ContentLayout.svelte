<script lang="ts">
	import Footer from './Footer.svelte';

	interface Props {
		title?: import('svelte').Snippet;
		sidebar?: import('svelte').Snippet;
		sidebarFooter?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let { title, sidebar, sidebarFooter, children }: Props = $props();
</script>

<!-- Mobile layout -->
<div class="flex flex-col px-4 pt-6 md:hidden">
	{#if title}
		{@render title()}
	{/if}
	{#if sidebar}
		{@render sidebar()}
	{/if}
	{#if sidebarFooter}
		{@render sidebarFooter()}
	{/if}
	{@render children?.()}
</div>

<!-- Desktop layout: sticky sidebar -->
<div class="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-8 px-4 relative h-full">
	<div class="fixed left-0 top-10 w-1/3 lg:w-1/4 pt-8 pb-10 h-full pl-4">
		{#if title}
			{@render title()}
		{/if}
		{#if sidebar}
			<div class="mt-4">
				{@render sidebar()}
			</div>
		{/if}
		<div class="absolute bottom-0">
			{#if sidebarFooter}
				{@render sidebarFooter()}
			{/if}
			<Footer />
		</div>
	</div>
	<div class="col-span-1"></div>
	<div class="col-span-2 lg:col-span-3 pt-8">
		{@render children?.()}
	</div>
</div>
