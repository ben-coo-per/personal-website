<script lang="ts">
	import { fade } from 'svelte/transition';

	// uses portable text to render the about page body content
	import type { PageData } from './$types';
	export let data: PageData;

	import { inview } from 'svelte-inview';

	const paragraphs = data.about.body.map((block, i) => {
		return {
			id: i,
			text: block.children
				.map((child) => {
					return child.text;
				})
				.join(' ')
		};
	});

	let paragraphsInView: Record<number, boolean> = {};
</script>

<section class="text-stone-50 p-6 bg-custom-black" in:fade|global={{ duration: 350 }}>
	<div class="container mx-auto relative pb-96 pt-24">
		{#each paragraphs as paragraph}
			<p
				class="text-4xl md:text-6xl font-serif font-thin leading-relaxed md:leading-relaxed py-40"
				class:in-view={paragraphsInView[paragraph.id]}
				use:inview={{ rootMargin: '-40%' }}
				on:inview_change={(event) => {
					const { inView } = event.detail;
					paragraphsInView[paragraph.id] = inView;
				}}
			>
				{paragraph.text}
			</p>
		{/each}
	</div>
</section>

<style lang="scss">
	.in-view {
		opacity: 1;
		transform: translate(0, -20px);
		transition: opacity 1s, transform 0.5s;
	}
	p:not(.in-view) {
		opacity: 0;
		transform: translate(0, 0);
		transition: opacity 2s, transform 2s;
	}
</style>
