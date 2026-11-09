<script lang="ts">
	import type { FreeformPageProps } from '.';
	import { Clip, Figure, Mosaic, MosaicCell } from '$lib/log';

	let { asset }: FreeformPageProps = $props();

	// Each run of pictures is a hand-placed collage on the mosaic's 12-column grid.
	// `col` is the cell's grid-column; `shift` drops it lower so rows don't line up.
	type Cell = {
		file: string;
		alt: string;
		clip?: boolean;
		col: string;
		shift?: number;
		align?: 'start' | 'center' | 'end';
		wide?: boolean;
	};

	// The piece at the festival, as the opener.
	const opener: Cell[] = [
		{ file: 'gerfest1.jpeg', alt: 'The sculpture lit up inside the festival tent', col: '1 / span 4' },
		{ file: 'zayna_and_ben.jpg', alt: 'Zayna and Ben in front of the sculpture', col: '5 / span 8', shift: 60, wide: true }
	];

	// The drilling jig for the 32 holes, each 30 degrees from its neighbour.
	const jig: Cell[] = [
		{ file: 'jig1.png', alt: 'CAD model of the drilling jig', col: '1 / span 3', shift: 80 },
		{ file: 'jig2.jpeg', alt: 'The jig clamped onto the main mount tube', col: '4 / span 4' },
		{ file: 'jig3.jpeg', alt: 'Lining the jig up on the tube before drilling', col: '8 / span 5', shift: 140 }
	];

	// A week with the metalshop closed: the makeshift drilling handles.
	const handles: Cell[] = [
		{ file: 'handle-wood1.jpeg', alt: 'A wooden drill handle, first attempt', col: '1 / span 3' },
		{ file: 'handle-wood2.jpeg', alt: 'The wooden handle on the drill', col: '4 / span 3', shift: 100 },
		{ file: 'handle-wood3.jpeg', alt: 'Drilling with the wooden handle', col: '7 / span 3', shift: 30 },
		{ file: 'handle-wood4.jpeg', alt: 'The wooden handle, broken', col: '10 / span 3', shift: 130 }
	];

	// 32 holes later.
	const drilled: Cell[] = [
		{ file: 'handle-plastic.jpeg', alt: 'The replacement plastic and metal handle', col: '2 / span 3', shift: 80 },
		{ file: 'drilledholes.jpeg', alt: 'The main mount with all 32 holes drilled', col: '5 / span 4' },
		{ file: 'frame1.jpeg', alt: 'The hexagonal base frame with its first two uprights', col: '9 / span 3', shift: 140 }
	];

	// The frame going up and the first light tests.
	const build: Cell[] = [
		{ file: 'frame.jpeg', alt: 'The frame assembled in the workshop', col: '1 / span 4' },
		{ file: 'structure.jpeg', alt: 'The full structure standing, tubes not yet lit', col: '5 / span 3', shift: 120 },
		{ file: 'lights_inprog.mp4', clip: true, alt: 'The tubes lighting up for the first time', col: '9 / span 4', shift: 40 },
		{ file: 'zaynatheriveter.jpeg', alt: 'Zayna riveting the tubes in place', col: '1 / span 6', shift: 40, wide: true },
		{ file: 'testingwmusic.mp4', clip: true, alt: 'Testing the spectrum analyser with music', col: '8 / span 4', shift: 100 }
	];

	// Electronics: the wireless microphone and the motor controller.
	const electronics: Cell[] = [
		{ file: 'microphone_inner.jpeg', alt: 'Inside the wireless microphone box', col: '1 / span 4', shift: 60 },
		{ file: 'microphone_box.jpeg', alt: 'The finished microphone box', col: '5 / span 4' },
		{ file: 'motor_controller.jpeg', alt: 'The motor controller board', col: '9 / span 4', shift: 120 }
	];

	// Festival day.
	const festival: Cell[] = [
		{ file: 'zaynaexplaining.jpg', alt: 'Zayna explaining the piece to visitors', col: '1 / span 7', wide: true },
		{ file: 'ben_explaining1.jpg', alt: 'Ben explaining the piece to a family', col: '8 / span 5', shift: 120 },
		{ file: 'wowedkid1.jpg', alt: 'A child watching the tubes light up', col: '2 / span 5', shift: 40 },
		{ file: 'loudkidexplaining.jpg', alt: 'Explaining the microphone to a child', col: '7 / span 6', shift: 100, wide: true },
		{ file: 'loudkid1.jpg', alt: 'A child yelling into the microphone', col: '1 / span 6', wide: true },
		{ file: 'loudkid2.jpg', alt: 'The tubes responding to the yell', col: '7 / span 6', shift: 60, wide: true },
		{ file: 'gerfest3.mp4', clip: true, alt: 'The sculpture responding to sound at the festival', col: '2 / span 3', shift: 40 },
		{ file: 'something_funny.jpg', alt: 'Zayna and Ben laughing with visitors', col: '5 / span 8', shift: 80, wide: true },
		{ file: 'wowedkid.jpg', alt: 'A wowed child in front of the sculpture', col: '1 / span 5' },
		{ file: 'gerfest2.jpeg', alt: 'The sculpture glowing purple in the tent', col: '6 / span 3', shift: 100 },
		{ file: 'ben_explaining2.jpg', alt: 'Ben talking visitors through the piece', col: '9 / span 4', shift: 40 }
	];
</script>

{#snippet collage(cells: Cell[])}
	<Mosaic class="collage">
		{#each cells as { file, alt, clip, col, shift, align, wide } (file)}
			<MosaicCell {col} {shift} {align} {wide}>
				{#if clip}
					<Clip src={asset(file)} autoplay label={alt} />
				{:else}
					<Figure src={asset(file)} {alt} />
				{/if}
			</MosaicCell>
		{/each}
	</Mosaic>
{/snippet}

{@render collage(opener)}

<p class="lede">
	Visualizing Sound was a 2m tall spectrum analyzer that took an input from a wireless microphone
	and displayed the sound as a series of 32 tubes of light. Each tube represented a different
	frequency band, and the width of the light in each tube corresponded to the amplitude of that
	frequency in the sound.
</p>

<p>
	There were also a few other modes we built to help explain the movement of sound waves and the
	difference in frequencies.
</p>

<p>
	The piece was created as a way to help children and adults attending the Great Exhibition Road
	Festival in London to understand the physics of sound and how it can be visualized. It was also
	a way to encourage people to think about the relationship between art and science, and how
	tapping into different senses can create art that is unique and beautiful (e.g. Beethoven, after
	losing his hearing, composed using a wooden rod's vibrations).
</p>

<p>
	I led the mechanical, electronics, programming, and firmware build of the piece, while
	<a href="https://www.linkedin.com/in/zaynazahmed/">Zayna Ahmed</a> focused on the visualizations,
	sound processing, and overall design.
	<a href="https://royalcommission1851.org/">The Royal Commission for the Exhibition of 1851</a> and
	<a href="https://www.big-ideas.org/">the Big Ideas Organization</a> funded the creation of this
	work.
</p>

<p>
	While working on the main mount that holds the lights, we needed to ensure that each hole was
	exactly offset by 30 degrees from its neighbor. In order to mark and drill these holes I created a
	simple jig with alignment pins that would ensure the correct spacing and angle for each hole.
</p>

{@render collage(jig)}

<p>
	I was also building this part of the sculpture during a week when the metalshop was closed, so I
	had to get creative with a makeshift drilling setup.
</p>

{@render collage(handles)}

<p>
	After spending a day repeating to myself "only a poor craftsman blames their tools" and listening
	to an audiobook, I finally finished drilling out 32 holes in the main mount. In hindsight, I
	probably should have just waited for the metalshop to open, but I was on a tight schedule and
	wanted to keep making progress.
</p>

{@render collage(drilled)}

{@render collage(build)}

<p>
	The rest of the build went fairly smoothly. The electronics were fun - since they were spinning
	we needed to provide power through a slipring, and since the slipring would not be able to
	preserve the delicate signals we're sending to the LEDs, I ended up putting an ESP32 inside of
	the rotating assembly and sending the packets wirelessly to it. This had the added side benefit
	of a wireless microphone input that we could hand to festival attendees to interact with the
	piece.
</p>

{@render collage(electronics)}

<p>
	The piece was a huge hit at the festival and we had a lot of fun interacting with attendees and
	explaining the science behind the piece. (Also tons of shrieking children attempting to light up
	the highest frequency tubes hahaaaaa).
</p>

{@render collage(festival)}
