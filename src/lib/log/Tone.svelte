<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A passage of the page on its own ground. `dark` lays the site's black behind its
	 * children, fading in above and out below, so a page on a light hero video can go
	 * dark for a stretch and come back. Text inside returns to the normal light ink.
	 */
	interface Props {
		tone?: 'dark';
		class?: string;
		children: Snippet;
	}

	let { tone = 'dark', class: className = '', children }: Props = $props();
</script>

<section class="tone tone--{tone} {className}">
	{@render children()}
</section>
