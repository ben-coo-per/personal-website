<script lang="ts">
	import type { FreeformPageProps } from '.';
	import { Clip, Figure, MediaStack, Mosaic, MosaicCell, WipVeil } from '$lib/log';

	let { asset }: FreeformPageProps = $props();

	// Process, in the order the build happened. New shots go in by the date they were taken.
	// `col` places each one on the mosaic's 12-column grid; `shift` drops it lower.
	const process: {
		file: string;
		alt?: string;
		clip?: boolean;
		col: string;
		shift?: number;
		align?: 'start' | 'center' | 'end';
		wide?: boolean;
	}[] = [
		{ file: 'gallery-2.jpg', alt: 'Looking down into the diffuser at the drive motors', col: '1 / span 7', wide: true },
		{ file: 'gallery-9.jpg', alt: 'The motor base plate on the bench', col: '9 / span 4', shift: 120 },
		{ file: 'gallery-12.jpg', alt: 'The lamp lit up, glowing orange through the fluted glass', col: '2 / span 4' },
		{ file: 'video-1.mp4', clip: true, alt: 'The lamp changing colour', col: '7 / span 4', align: 'center' },
		{ file: 'gallery-5.jpg', alt: 'Bench prototype with a lit LED column', col: '1 / span 5' },
		{ file: 'gallery-8.jpg', alt: 'Testing the size with an off-the-shelf globe', col: '7 / span 3', shift: 160 },
		{ file: 'gallery-6.jpg', alt: 'Orange prototype globe sitting in its ring', col: '10 / span 3', shift: 48 },
		{ file: 'gallery-7.jpg', alt: 'Prototype ring with contact pins', col: '3 / span 3' },
		{ file: 'gallery-13.jpg', alt: 'Two 3D-printed dodecahedron shells stacked on a table', col: '7 / span 5', shift: 80 },
		{ file: 'gallery-14.jpg', alt: 'Notebook sketch of the U-shaped base board and motor mounts', col: '2 / span 4' },
		{ file: 'gallery-10.jpg', alt: 'Render of the base circuit board', col: '7 / span 6', shift: 120, wide: true },
		{ file: 'gallery-15.jpg', alt: 'Layout of the pentagonal LED panel, its LEDs and capacitors on a triangulated grid', col: '2 / span 5', shift: 40 },
		{ file: 'gallery-16.jpg', alt: 'Render of the dodecahedron shell, its pentagonal panels bolted together', col: '8 / span 5', shift: 160 }
	];
</script>

<p class="wip-note">
	<strong>Work in progress</strong>
	<span>A completely new version is underway, with new mechanisms, lighting and hardware throughout.</span>
</p>

<MediaStack spacious>
	<Figure
		class="narrow"
		src={asset('gallery-4.jpg')}
		alt="The painted plaster globe sitting in the fluted glass"
	/>
</MediaStack>

<p class="section-label">Process</p>

<Mosaic>
	{#each process as { file, alt, clip, col, shift, align, wide } (file)}
		<MosaicCell {col} {shift} {align} {wide}>
			{#if clip}
				<Clip src={asset(file)} autoplay label={alt} />
			{:else}
				<Figure src={asset(file)} alt={alt ?? ''} />
			{/if}
		</MosaicCell>
	{/each}
</Mosaic>

<MediaStack spacious>
	<WipVeil
		class="narrow"
		src={asset('gallery-1.jpg')}
		note="More to come as the build comes together."
	/>
</MediaStack>
