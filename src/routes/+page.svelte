<script lang="ts">
	import Card from '../components/Card.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div>
	{#each data.projects as project}
		<Card {project} />
	{/each}
</div>
