<script lang="ts">
	import Card from '../components/Card.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	let scrollY: number;
</script>

<svelte:window bind:scrollY />

{#each data.projects as project}
	<Card {project} />
{/each}

<div class="fixed top-0 right-0 z-30 bg-red-500">
	<p>{scrollY}</p>
</div>
