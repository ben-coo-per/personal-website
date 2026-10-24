<script lang="ts">
	import type { FreeformPageProps } from '.';
	import { Clip, Figure, FullBleed, MediaGrid, MediaStack, WipVeil } from '$lib/log';

	let { asset }: FreeformPageProps = $props();

	const shot = (file: string, alt: string) => ({ src: asset(file), alt });

	// Process: the build, from the first orange prints to the motors in the base.
	const process = [
		shot('gallery-2.jpg', 'Looking down into the diffuser at the drive motors'),
		shot('gallery-9.jpg', 'The motor base plate on the bench'),
		shot('gallery-5.jpg', 'Bench prototype with a lit LED column'),
		shot('gallery-8.jpg', 'Testing the size with an off-the-shelf globe'),
		shot('gallery-6.jpg', 'Orange prototype globe sitting in its ring'),
		shot('gallery-7.jpg', 'Prototype ring with contact pins')
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
	<Figure
		class="narrow"
		aspect="3/4"
		src={asset('gallery-3.jpg')}
		alt="The painted plaster globe build in the light tent"
	/>
	<Figure
		class="narrow"
		src={asset('gallery-12.jpg')}
		alt="The lamp lit up, glowing orange through the fluted glass"
	/>
	<Clip src={asset('video-1.mp4')} autoplay label="The lamp changing colour" />
</MediaStack>

<p class="section-label">Process</p>

<MediaStack class="narrow">
	<MediaGrid cols={2} aspect="1/1">
		{#each process as { src, alt } (src)}
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
