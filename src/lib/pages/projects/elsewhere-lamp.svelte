<script lang="ts">
	import type { FreeformPageProps } from '.';
	import { Clip, Figure, MediaGrid, MediaStack, Model, Mosaic, MosaicCell, Tone, WipVeil } from '$lib/log';

	let { asset }: FreeformPageProps = $props();

	// Process, in the order the build happened. New shots go in by the date they were taken.
	// `process` is the first prototype, shown on black; `rebuild` continues on the sky.
	// Short notes sit in the same grid as the pictures and tell the story between them.
	// `col` places each cell on the mosaic's 12-column grid; `shift` drops it lower.
	const process: {
		file?: string;
		text?: string;
		alt?: string;
		clip?: boolean;
		col: string;
		shift?: number;
		align?: 'start' | 'center' | 'end';
		wide?: boolean;
		/** Line art on white: blended into the page so only the lines show. */
		ink?: boolean;
	}[] = [
		{ file: 'gallery-2.jpg', alt: 'Looking down into the diffuser at the drive motors', col: '1 / span 7', wide: true },
		{ file: 'gallery-9.jpg', alt: 'The motor base plate on the bench', col: '9 / span 4', shift: 120 },
		{
			text: 'While I was living overseas, my partner and our dog stayed behind in NYC. I found myself often thinking about how it looked and felt there.',
			col: '7 / span 4',
			wide: true
		},
		{ file: 'gallery-12.jpg', alt: 'The lamp lit up, glowing orange through the fluted glass', col: '2 / span 4' },
		{ file: 'video-1.mp4', clip: true, alt: 'The lamp changing colour', col: '7 / span 4', align: 'center' },
		{
			text: 'I would see it over FaceTime when they were out on their morning walk, but it never felt like it did the light justice.',
			col: '7 / span 4',
			wide: true
		},
		{ file: 'gallery-5.jpg', alt: 'Bench prototype with a lit LED column', col: '1 / span 5' },
		{ file: 'gallery-8.jpg', alt: 'Testing the size with an off-the-shelf globe', col: '7 / span 3', shift: 160 },
		{ file: 'gallery-6.jpg', alt: 'Orange prototype globe sitting in its ring', col: '10 / span 3', shift: 48 },
		{
			text: 'That’s what inspired me to make a lamp that focuses your attention on how another place feels.',
			col: '2 / span 4',
			wide: true
		},
		{ file: 'gallery-7.jpg', alt: 'Prototype ring with contact pins', col: '3 / span 3' },
		{
			text: 'This first prototype took an honorable mention at the Design Education Trust’s INTERPLAY 26 competition.',
			col: '7 / span 4',
			align: 'center',
			wide: true
		}
	];

	// The rebuild, from the dodecahedron prototypes on. Back on the sky.
	const rebuild: typeof process = [
		{
			text: 'Now I’m rebuilding it from the ground up to do the idea justice.',
			col: '1 / span 5',
			align: 'center',
			wide: true
		},
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
		{ file: 'gallery-18.jpg', alt: 'A sheet of profile sketches: the globe on twelve different bases and stands', col: '6 / span 7', shift: 80, wide: true, ink: true },
		{ file: 'gallery-19.jpg', alt: 'Profile sketches of textured bases: fluted drums, perforated stems, collars', col: '2 / span 6', wide: true, ink: true },
		{ file: 'gallery-20.jpg', alt: 'Profile sketches of faceted sockets cradling the globe', col: '8 / span 5', shift: 120, ink: true },
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

	// Shell engineering drawings, Nov 6–8: one small strip of line art.
	const shell: { file: string; alt: string }[] = [
		{ file: 'gallery-39.jpg', alt: 'Section through the shell: frame, base cage and stem' },
		{ file: 'gallery-40.jpg', alt: 'One pentagonal segment of the shell with its standoffs' },
		{ file: 'gallery-41.jpg', alt: 'The shell exploded: panels lifted off the frame and base' },
		{ file: 'gallery-42.jpg', alt: 'The bare truncated-icosahedron shell' },
		{ file: 'gallery-43.jpg', alt: 'The shell assembled on its stem' }
	];

	// Nov 12: the base as an airplane window, from the notebook to the first line renders.
	const windowBase: typeof process = [
		{ file: 'gallery-45.jpg', alt: 'Pencil sketch of the globe sitting in a fluted, round-bottomed cup', col: '1 / span 3' },
		{ file: 'gallery-46.jpg', alt: 'Pencil sketches of a rounded window outline and a small fluted cup', col: '4 / span 3', shift: 90 },
		{ file: 'gallery-47.jpg', alt: 'Pen sketch of an airplane window with its shade half down, the edge circled', col: '7 / span 3', shift: 30 },
		{ file: 'gallery-48.jpg', alt: 'Reference: sunset over clouds through an airplane window', col: '10 / span 3', shift: 150 },
		{ file: 'gallery-50.jpg', alt: 'Sketch of the window frame turned about its centre line to make the flute profile', col: '1 / span 4', align: 'center' },
		{ file: 'gallery-51.jpg', alt: 'Line render of the window base: a ring of window-shaped flutes', col: '5 / span 4', ink: true },
		{ file: 'gallery-52.jpg', alt: 'Line render of the window base from the side', col: '9 / span 4', shift: 60, ink: true }
	];
</script>

<p class="wip-note">
	<strong>Work in progress</strong>
	<span>A completely new version is underway, with new mechanisms, lighting and hardware throughout.</span>
</p>

{#snippet cells(items: typeof process)}
	{#each items as { file, text, alt, clip, col, shift, align, wide, ink } (file ?? text)}
		<MosaicCell {col} {shift} {align} {wide}>
			{#if text}
				<p class="mosaic__note">{text}</p>
			{:else if clip}
				<Clip src={asset(file!)} autoplay label={alt} />
			{:else}
				<Figure src={asset(file!)} alt={alt ?? ''} class={ink ? 'ink' : ''} />
			{/if}
		</MosaicCell>
	{/each}
{/snippet}

<!-- The first prototype sits on black; the sky comes back with the rebuild. -->
<Tone tone="dark">
	<MediaStack spacious>
		<Figure
			class="narrow"
			src={asset('gallery-4.jpg')}
			alt="The painted plaster globe sitting in the fluted glass"
		/>
	</MediaStack>

	<p class="section-label">Process</p>

	<Mosaic>
		{@render cells(process)}
	</Mosaic>
</Tone>

<Mosaic>
	{@render cells(rebuild)}
</Mosaic>

<!-- Base form studies and shell drawings: small strips of line art, blended into the page. -->
<MediaGrid cols={5} aspect="1/1" class="ink-strip">
	{#each studies as { file, alt } (file)}
		<Figure src={asset(file)} {alt} class="ink" />
	{/each}
</MediaGrid>

<MediaGrid cols={5} natural class="ink-strip">
	{#each shell as { file, alt } (file)}
		<Figure src={asset(file)} {alt} class="ink" />
	{/each}
</MediaGrid>

<!-- Nov 9: the light simulator, and the crate panel it checks, as a model to turn over. -->
<MediaStack spacious>
	<Figure
		src={asset('gallery-44.jpg')}
		alt="The light simulator: the lit shell rendered on the left, its LEDs and crate cells in wireframe on the right"
	/>
	<MediaGrid cols={2} aspect="16/9">
		<Clip
			src={asset('video-2.mp4')}
			autoplay
			label="The light simulator running: the shell's glow updating as the sky turns"
		/>
		<Model
			src={asset('crate-panel-v5.stl')}
			label="Crate panel v5, a 3D model. Drag to turn it."
			aspect="16/9"
			color="#f4efe6"
			light="#f3a1bf"
			badge={false}
			bare
		/>
	</MediaGrid>
</MediaStack>

<Mosaic>
	{@render cells(windowBase)}
</Mosaic>

<MediaStack spacious>
	<WipVeil
		class="narrow"
		src={asset('gallery-1.jpg')}
		note="More to come as the build comes together."
	/>
</MediaStack>
