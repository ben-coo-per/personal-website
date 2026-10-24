<script lang="ts">
	import type { FreeformPageProps } from '.';
	import { Clip, Figure, FullBleed, MediaGrid } from '$lib/log';

	let { asset }: FreeformPageProps = $props();

	const shot = (n: number, caption: string, ext = 'jpg') => ({
		src: asset(`gallery-${String(n).padStart(2, '0')}.${ext}`),
		caption
	});

	// Phase one: a steel frame that had to survive the jumps.
	const chassisPair = [
		shot(1, 'CAD model of the chassis frame', 'png'),
		shot(11, 'The bare rolling chassis')
	];
	const chassisSheet = [
		shot(2, 'Laying out the cut steel for the chassis'),
		shot(3, 'Welded frame sections'),
		shot(4, 'The frame taking shape in the welding booth'),
		shot(5, 'Welding the chassis'),
		shot(6, 'Fresh welds, happy welder'),
		shot(7, "Driver's-eye view from inside Henry"),
		shot(8, 'The acceptance box from Red Bull'),
		shot(9, 'Fitting out the rolling chassis'),
		shot(10, 'First sit in the body frame')
	];

	// Phase two: cardboard, paint, and a face.
	const facePair = [shot(19, "Henry's face taking shape"), shot(21, "Painting Henry's smile")];
	const faceSheet = [
		shot(12, 'Making the cardboard skin panels'),
		shot(13, 'Wrapping the shell around the frame'),
		shot(14, 'Consulting the reference Henry'),
		shot(15, 'Chassis assembly'),
		shot(16, "First look through Henry's eyes"),
		shot(17, 'Head through the nose hole'),
		shot(18, 'Checking driver visibility'),
		shot(20, 'First coat of red'),
		shot(22, 'Inside the cockpit')
	];

	// Phase three: Alexandra Palace.
	const raceSheet = [
		shot(23, 'Henry leaving the workshop'),
		shot(24, 'Maverick and Goose ride to the race'),
		shot(25, 'The finished Henry in the paddock'),
		shot(26, 'Race-day tinkering in the paddock'),
		shot(27, 'The team with Henry on race day'),
		shot(28, 'Waiting near the start line'),
		shot(29, 'The course at Alexandra Palace'),
		shot(30, 'Henry on the start ramp'),
		shot(32, 'The team at the finish')
	];
</script>

<FullBleed>
	<Figure
		src={asset('gallery-31.jpg')}
		alt="Henry airborne over the jump at Alexandra Palace"
		loading="eager"
	/>
</FullBleed>

<p class="lede">
	Earlier this year, three of my coursemates and I applied to the London Red Bull Soapbox Race with
	a sketch of a giant Henry Hoover - and somehow got accepted. That left us with a fun problem:
	build a race-worthy soapbox while all four of us were in the thick of our Master's theses.
</p>

<p>
	We chose Henry because he's a British icon, he's roughly the right shape for a soapbox, and, most
	importantly, our driver's name was Henry, copilot was me (Ben) and it was a stupid, but funny bit
	to call the car "Benry".
</p>

<div class="eyebrow">01 · frame and steering</div>
<h2>The chassis</h2>

<p>
	I designed the chassis and steering - the parts that had to survive the jumps and keep us pointed
	down the track - and worked on every part of the build alongside the team. All in, we probably
	spent a couple of weeks of actual build time on it, spread between thesis deadlines and work.
</p>

<MediaGrid cols={2} natural>
	{#each chassisPair as { src, caption } (src)}
		<Figure {src} alt={caption} {caption} />
	{/each}
</MediaGrid>

<MediaGrid cols={3} dense>
	{#each chassisSheet as { src, caption } (src)}
		<Figure {src} alt={caption} />
	{/each}
</MediaGrid>

<div class="eyebrow">02 · skin and face</div>
<h2>Becoming Henry</h2>

<p>
	Cardboard panels wrapped around the frame gave him his shape, then a lot of red paint and one very
	carefully painted smile. The nose doubles as the driver's window.
</p>

<MediaGrid cols={2}>
	{#each facePair as { src, caption } (src)}
		<Figure {src} alt={caption} {caption} />
	{/each}
</MediaGrid>

<MediaGrid cols={3} dense>
	{#each faceSheet as { src, caption } (src)}
		<Figure {src} alt={caption} />
	{/each}
</MediaGrid>

<div class="eyebrow">03 · alexandra palace</div>
<h2>Race day</h2>

<p>For something we threw together in a month, Henry held up remarkably well on race day.</p>

<MediaGrid cols={3} dense>
	{#each raceSheet as { src, caption } (src)}
		<Figure {src} alt={caption} />
	{/each}
</MediaGrid>

<FullBleed>
	<Clip
		src={asset('run.mp4')}
		poster={asset('gallery-31.jpg')}
		caption="The run down the hill"
		label="Video of Henry racing down the Alexandra Palace course"
	/>
</FullBleed>
