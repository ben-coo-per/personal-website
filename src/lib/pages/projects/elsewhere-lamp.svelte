<script lang="ts">
	import type { FreeformPageProps } from '.';
	import { Clip, Figure, MediaGrid, MediaStack, Mosaic, MosaicCell, WipVeil } from '$lib/log';

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
		{ file: 'gallery-16.jpg', alt: 'Render of the dodecahedron shell, its pentagonal panels bolted together', col: '8 / span 5', shift: 160 },
		{ file: 'gallery-32.jpg', alt: 'Render of the round base board, its connectors ringed around the edge', col: '1 / span 5' },
		{ file: 'gallery-33.jpg', alt: 'A notebook spread of thumbnail sketches: globes on stands, cradles and drums', col: '7 / span 5', shift: 100 },
		{ file: 'gallery-34.jpg', alt: 'A notebook page of globes on pedestals and stacked plinths', col: '2 / span 4' },
		{ file: 'gallery-35.jpg', alt: 'CAD of the open dodecahedron frame sitting on the base cage', col: '7 / span 6', shift: 60 },
		{ file: 'gallery-36.jpg', alt: 'Section sketch of the mechanism: globe, spring, shaft and base', col: '1 / span 4' },
		{ file: 'gallery-37.jpg', alt: 'CAD of the base, half-clad in LED panels around the motor mounts', col: '6 / span 7', shift: 80, wide: true },
		{ file: 'gallery-38.jpg', alt: 'A notebook page of base ideas: slotted column, fluted drums, faceted globe, tripod', col: '2 / span 4' },
		{ file: 'gallery-17.jpg', alt: 'The v10 dodecahedron frame in CAD', col: '7 / span 4', shift: 60 },
		{ file: 'gallery-18.jpg', alt: 'A sheet of profile sketches: the globe on twelve different bases and stands', col: '6 / span 7', shift: 80, wide: true },
		{ file: 'gallery-19.jpg', alt: 'Profile sketches of textured bases: fluted drums, perforated stems, collars', col: '2 / span 6', wide: true },
		{ file: 'gallery-20.jpg', alt: 'Profile sketches of faceted sockets cradling the globe', col: '8 / span 5', shift: 120 },
		{ file: 'gallery-21.jpg', alt: 'Study: a faceted socket with a crown rest on a plinth', col: '3 / span 4' }
	];

	// Form studies for the base, in the order they were drawn. Padded square at conversion.
	const studies: { file: string; alt: string }[] = [
		{ file: 'gallery-22.jpg', alt: 'Study: a fluted drum base' },
		{ file: 'gallery-23.jpg', alt: 'Study: a ribbed two-tier base' },
		{ file: 'gallery-24.jpg', alt: 'Study: a perforated collar' },
		{ file: 'gallery-25.jpg', alt: 'Study: a mesh skirt' },
		{ file: 'gallery-26.jpg', alt: 'Study: a collar with small dots' },
		{ file: 'gallery-27.jpg', alt: 'Study: an icositetrahedron shell on a dotted collar' },
		{ file: 'gallery-28.jpg', alt: 'Study: an icositetrahedron shell on a mesh collar' },
		{ file: 'gallery-29.jpg', alt: 'Study: a knurled collar, 8mm tall' },
		{ file: 'gallery-30.jpg', alt: 'Study: a knurled collar, 16mm tall' },
		{ file: 'gallery-31.jpg', alt: 'Study: a 2mm knurled band' }
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

<MediaGrid aspect="1/1">
	{#each studies as { file, alt } (file)}
		<Figure src={asset(file)} {alt} />
	{/each}
</MediaGrid>

<MediaStack spacious>
	<WipVeil
		class="narrow"
		src={asset('gallery-1.jpg')}
		note="More to come as the build comes together."
	/>
</MediaStack>
