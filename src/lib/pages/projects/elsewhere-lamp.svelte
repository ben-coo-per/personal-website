<script lang="ts">
	import type { FreeformPageProps } from '.';
	import { Clip, Figure, FullBleed, MediaGrid, MediaStack, WipVeil } from '$lib/log';

	let { asset }: FreeformPageProps = $props();

	const shot = (file: string, alt: string) => ({ src: asset(file), alt });

	// Process, in the order the build happened. New shots go in by the date they were taken.
	const processBefore = [
		shot('gallery-2.jpg', 'Looking down into the diffuser at the drive motors'),
		shot('gallery-9.jpg', 'The motor base plate on the bench'),
		shot('gallery-3.jpg', 'The painted plaster globe build in the light tent'),
		shot('gallery-12.jpg', 'The lamp lit up, glowing orange through the fluted glass')
	];

	const processAfter = [
		shot('gallery-5.jpg', 'Bench prototype with a lit LED column'),
		shot('gallery-8.jpg', 'Testing the size with an off-the-shelf globe'),
		shot('gallery-6.jpg', 'Orange prototype globe sitting in its ring'),
		shot('gallery-7.jpg', 'Prototype ring with contact pins'),
		shot('gallery-13.jpg', 'Two 3D-printed dodecahedron shells stacked on a table'),
		shot('gallery-14.jpg', 'Notebook sketch of the U-shaped base board and motor mounts')
	];
</script>

<p class="wip-note">
	<strong>Work in progress</strong>
	<span>Working on the bench. The form and the sky model are still changing.</span>
</p>

<FullBleed>
	<Figure
		src={asset('gallery-4.jpg')}
		alt="The painted plaster globe sitting in the fluted glass"
		loading="eager"
	/>
</FullBleed>

<MediaStack spacious>
	<Clip
		class="slim"
		src={asset('video-2.mp4')}
		poster={asset('video-2-poster.jpg')}
		autoplay
		label="A pink dusk sky with planes passing overhead"
	/>
</MediaStack>

<p class="section-label">Process</p>

<MediaStack class="narrow">
	<MediaGrid cols={2} aspect="1/1">
		{#each processBefore as { src, alt } (src)}
			<Figure {src} {alt} />
		{/each}
	</MediaGrid>
	<Clip src={asset('video-1.mp4')} autoplay label="The lamp changing colour" />
	<MediaGrid cols={2} aspect="1/1">
		{#each processAfter as { src, alt } (src)}
			<Figure {src} {alt} />
		{/each}
	</MediaGrid>
	<Figure src={asset('gallery-10.jpg')} alt="Render of the base circuit board" />
</MediaStack>

<MediaStack spacious>
	<WipVeil
		class="narrow"
		src={asset('gallery-1.jpg')}
		note="More to come as the build comes together."
	/>
</MediaStack>
