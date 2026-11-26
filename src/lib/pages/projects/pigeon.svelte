<script lang="ts">
	import type { FreeformPageProps } from '.';
	import PigeonField from '$lib/pigeon/PigeonField.svelte';
	import ScrollFizzle from '$lib/pigeon/ScrollFizzle.svelte';
	import Multitruchet from '$lib/pigeon/Multitruchet.svelte';
	import LivePattern from '$lib/pigeon/LivePattern.svelte';
	import GapReveal from '$lib/pigeon/GapReveal.svelte';
	import { progress, rise, span, smooth } from '$lib/pigeon/scroll';
	import caseScene from '$lib/pigeon/assets/case-scene.webp';
	import revealClip from '$lib/pigeon/assets/reveal-clip.webp';
	import {
		caseStudy,
		toolFamilies,
		quadrant,
		pillars,
		claims,
		people,
		captures,
		fieldMap,
		prototyping,
		acknowledgements
	} from '$lib/pigeon/content';

	let { project, asset }: FreeformPageProps = $props();

	// The page wears the presentation's look (see the .pigeon rules in log.css). It
	// follows the deck's story top to bottom; the deck itself stays at the website URL.
	const deck = $derived(project.websiteUrl ?? 'https://pigeon.bencooper.xyz/');

	// Case-study opener: the scene photo resolves out of the pattern as it scrolls in.
	let sceneP = $state(0);
	// The PIGEON reveal: a tall section with a sticky frame, driven by scroll.
	let revealP = $state(0);
	// p runs from the section entering (0) to its end (1); it pins at ~0.31.
	const fizzle = $derived(span(revealP, 0.08, 0.55));
	const wrist = $derived(smooth(span(revealP, 0.55, 0.72)));
	const wordmark = $derived(smooth(span(revealP, 0.74, 0.88)));

	// Case-study timeline: one pinned gantt; the stop whose evidence is crossing the
	// middle of the screen lights up its bar. -1 = before the first stop.
	let activeStop = $state(-1);
	const stopEls: HTMLElement[] = [];
	function trackStop(node: HTMLElement, i: number) {
		stopEls[i] = node;
		const io = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) activeStop = i;
				// Scrolled back up above the first stop: nothing is current.
				else if (i === 0 && e.boundingClientRect.top > 0 && activeStop === 0) activeStop = -1;
			},
			{ rootMargin: '-50% 0px -49% 0px' }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}
	const goToStop = (i: number) => stopEls[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

	let pattern: LivePattern | undefined = $state();
	let patternStatus = $state('default');

	// Field map: capture → pin position on the basemap.
	const pin = (lat: number, lon: number) => {
		const b = fieldMap.bounds;
		return {
			x: ((lon - b.west) / (b.east - b.west)) * 100,
			y: ((b.north - lat) / (b.north - b.south)) * 100
		};
	};
	let hovered = $state<number | null>(null);

	const fmtTime = (iso: string) => {
		const d = new Date(iso);
		const dd = String(d.getUTCDate()).padStart(2, '0');
		const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
		const hh = String(d.getUTCHours()).padStart(2, '0');
		const mi = String(d.getUTCMinutes()).padStart(2, '0');
		return `${dd}.${mm} ${hh}:${mi}Z`;
	};
	const compact = (n: number) =>
		n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}K` : `${n}`;
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..900&family=IBM+Plex+Mono:wght@300;400;500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="pigeon">
	<!-- ───────────── title ───────────── -->
	<section class="pg-hero">
		<PigeonField />
		<a class="pg-hero__back" href="/projects">← projects</a>
		<div class="pg-hero__foot">
			<div class="pg-hero__lockup">
				<h1 class="pg-hero__title">PIGEON</h1>
				<p class="pg-hero__sub">A wrist wearable that makes corroboration searchable.</p>
				<ul class="pg-hero__meta pg-label">
					<li>Ben Cooper</li>
					<li>IDE 2 · Master's solo project</li>
					<li>June 2026</li>
				</ul>
			</div>
			<p class="pg-hero__note pg-label">
				Content note: the case study below includes images referencing a fatal shooting. Nothing
				graphic is shown.
			</p>
		</div>
	</section>

	<!-- ───────────── case study ───────────── -->
	<section class="pg-scene" use:progress={{ mode: 'enter', onchange: (p) => (sceneP = p) }}>
		<div class="pg-scene__art" data-no-lightbox>
			<ScrollFizzle src={caseScene} progress={smooth(span(sceneP, 0.1, 0.9))} rootGrid={66} maxDepth={1} />
		</div>
		<div class="pg-scene__copy">
			<p class="pg-eyebrow">Case study: Renee Good</p>
			<h2 class="pg-h2">Minneapolis, January 7, 2026.</h2>
			<p class="pg-lede">
				Renee Good is shot by an ICE officer in her car. Within hours, the record of what happened
				is being assembled from four directions at once, and the footage that could settle it
				surfaces in scattered pieces.
			</p>
		</div>
	</section>

	<section class="pg-wrap pg-case">
		<!-- The four phases on one shared time axis. It pins under the top of the
		     screen while the evidence scrolls beneath it; overlapping bars read as
		     phases running at the same time. -->
		<nav class="pg-tl" aria-label="Evidence timeline" data-active={activeStop}>
			<ol class="pg-tl__rows">
				{#each caseStudy as stop, i}
					<li>
						<button
							type="button"
							class="pg-tl__bar"
							class:is-active={activeStop === i}
							aria-current={activeStop === i ? 'step' : undefined}
							style:--off="{stop.offset}%"
							style:--w="{stop.width}%"
							onclick={() => goToStop(i)}
						>
							<span class="pg-tl__num">{stop.number}</span>
							<span class="pg-tl__label">{stop.label}</span>
							<span class="pg-tl__sub">{stop.sublabel}</span>
						</button>
					</li>
				{/each}
			</ol>
			<div class="pg-tl__axis" aria-hidden="true">
				<span>T+0 · Jan 7</span>
				<span>Time →</span>
			</div>
		</nav>

		{#each caseStudy as stop, i}
			<div class="pg-stop" id="stop-{stop.number}" use:trackStop={i}>
				<p class="pg-stop__head pg-label">
					<b>{stop.number}</b>
					{stop.label}
					<span>· {stop.sublabel}</span>
				</p>
				<div class="pg-stop__items" data-count={stop.items.length}>
					{#each stop.items as item, j}
						<figure class="pg-ev" use:rise style:--i={j % 4}>
							{#if item.type === 'tweet'}
								<article class="pg-tweet" data-platform={item.platform ?? 'x'}>
									<header>
										<img class="pg-tweet__av" src={asset(item.avatar)} alt="" data-no-lightbox />
										<span class="pg-tweet__who">
											<strong>{item.name}</strong>
											<span>@{item.handle}</span>
										</span>
										<span class="pg-tweet__net">{item.platform === 'truthsocial' ? 'T' : '𝕏'}</span>
									</header>
									<p class="pg-tweet__text">{item.text}…</p>
									<p class="pg-tweet__time">{item.timestamp}</p>
									<p class="pg-tweet__stats">
										<span><b>{compact(item.metrics.reposts)}</b> reposts</span>
										<span><b>{compact(item.metrics.likes)}</b> likes</span>
										{#if item.metrics.views}<span><b>{compact(item.metrics.views)}</b> views</span>{/if}
									</p>
								</article>
							{:else}
								<img src={asset(item.src)} alt={item.alt} loading="lazy" />
							{/if}
							<figcaption>
								<span>{item.caption}</span>
								<small>
									{item.source} · {item.date}
									{#if item.type === 'tweet' && item.archiveUrl}
										· <a href={item.archiveUrl} target="_blank" rel="noopener noreferrer">archived</a>
									{/if}
								</small>
							</figcaption>
						</figure>
					{/each}
				</div>
			</div>
		{/each}
		<p class="pg-note">
			Official statements land within hours. The citizen footage that contradicts them was filmed
			at the moment itself, but surfaces in pieces. Over the next six days a flood of doctored and
			misattributed media runs in parallel with the OSINT investigations, which only reach a
			coherent account at day six. Those days are where false narratives take hold.
		</p>
	</section>

	<!-- ───────────── existing tools ───────────── -->
	<section class="pg-wrap">
		<p class="pg-eyebrow">Existing tools</p>
		<div class="pg-tools">
			{#each toolFamilies as t}
				<figure class="pg-tool">
					<p class="pg-label">{t.kicker}</p>
					<!-- one word per line, so every title is the same two lines -->
					<h3 class="pg-h3 pg-tool__title">
						{#each t.label.split(' ') as word}<span>{word}</span>{/each}
					</h3>
					<img src={asset(t.src)} alt={t.alt} loading="lazy" />
					<figcaption>{t.blurb}</figcaption>
				</figure>
			{/each}
		</div>
	</section>

	<section class="pg-turn">
		<p class="pg-turn__setup">Right now, the scalable solutions answer:</p>
		<p class="pg-turn__q pg-turn__q--dim">“Is this image real?”</p>
		<p class="pg-turn__setup">But what we need is:</p>
		<p class="pg-turn__q">“Does other evidence exist?”</p>
	</section>

	<!-- ───────────── the gap ───────────── -->
	<section class="pg-wrap">
		<p class="pg-eyebrow">The gap</p>
		<figure class="pg-quad" aria-label="Existing tools plotted by authentication versus corroboration and manual versus scalable; the scalable corroboration corner is empty">
			<span class="pg-quad__axis pg-quad__axis--top">Scalable</span>
			<span class="pg-quad__axis pg-quad__axis--bottom">Manual</span>
			<span class="pg-quad__axis pg-quad__axis--left">Authentication</span>
			<span class="pg-quad__axis pg-quad__axis--right">Corroboration</span>
			<div class="pg-quad__plot">
				<div class="pg-quad__gap"><GapReveal /></div>
				{#each quadrant.points as pt}
					<span
						class="pg-quad__pt"
						class:is-anchor={pt.anchor}
						style:left="{pt.x * 100}%"
						style:bottom="{pt.y * 100}%">{pt.label}</span
					>
				{/each}
				<!-- Manual forensics is one method spanning both sides of the x axis:
				     drawn as a range bar from one worked example to the other. -->
				<div
					class="pg-quad__band"
					style:left="{quadrant.band.from * 100}%"
					style:right="{(1 - quadrant.band.to) * 100}%"
					style:bottom="{quadrant.band.y * 100}%"
				>
					<span class="pg-quad__band-label">{quadrant.band.label}</span>
					{#each quadrant.band.ends as end, i}
						<span class="pg-quad__end" class:is-right={i === 1}>{end.label}</span>
					{/each}
				</div>
			</div>
		</figure>
		<p class="pg-body">
			Authentication has an emerging ecosystem. <strong>Corroboration</strong> is still a slow,
			manual, heroic effort.
		</p>
	</section>

	<!-- ───────────── PIGEON reveal ───────────── -->
	<section class="pg-reveal" use:progress={{ mode: 'cover', onchange: (p) => (revealP = p) }}>
		<div class="pg-reveal__frame" data-no-lightbox>
			<ScrollFizzle src={revealClip} progress={fizzle} clip={fizzle} rootGrid={66} maxDepth={1} opacity={1 - 0.45 * wrist - 0.2 * wordmark} />
			<div
				class="pg-reveal__wrist"
				role="img"
				aria-label="The PIGEON device worn on a wrist"
				style:opacity={wrist}
				style:background-image="url({asset('reveal-wrist.webp')})"
			></div>
			<div class="pg-reveal__word" style:opacity={wordmark}>
				<p class="pg-reveal__title">PIGEON</p>
			</div>
		</div>
	</section>

	<section class="pg-wrap pg-demo">
		<p class="pg-eyebrow">Demo</p>
		<h2 class="pg-h2">One photo in, the moment back out.</h2>
		<!-- svelte-ignore a11y_media_has_caption -->
		<video src={asset('decode-demo.mp4')} poster={asset('decode-demo-poster.webp')} controls preload="none" playsinline></video>
		<p class="pg-caption">The decoder: a phone photo of the device goes in; the time, place and device identity come out.</p>
	</section>

	<!-- ───────────── how it works ───────────── -->
	<section class="pg-wrap">
		<p class="pg-eyebrow">How it works</p>
		<p class="pg-body">
			PIGEON is a beacon built from three parts (a GNSS module, a microcontroller and
			an e-ink display) for under £15, fully open source. Its face shows a constantly refreshing
			truchet pattern that encodes the device's ID, a per-device counter, a timestamp and
			coordinates, authenticated with an HMAC and wrapped in Reed–Solomon error correction.
		</p>
		<div class="pg-pillars">
			{#each pillars as p, i}
				<article class="pg-pillar" class:is-flip={i % 2 === 1} id="pillar-{p.id}">
					<div class="pg-pillar__media">
						{#if p.id === 'pattern'}
							<LivePattern
								bind:this={pattern}
								size={392}
								showReadout
								onstate={(s) => (patternStatus = s.status)}
								class="pg-live"
							>
								{#snippet overlay()}
									{#if patternStatus !== 'live'}
										<button
											class="pg-encode"
											type="button"
											disabled={patternStatus === 'locating'}
											onclick={() => pattern?.locate()}
										>
											<span class="pg-encode__pin" aria-hidden="true"></span>
											<span class="pg-encode__text">
												<b>
													{patternStatus === 'locating'
														? 'Encoding…'
														: patternStatus === 'denied'
															? 'No location, try again'
															: 'Make your own pattern'}
												</b>
												<small>Stamp where you are, right now</small>
											</span>
										</button>
									{/if}
								{/snippet}
							</LivePattern>
						{:else if p.image}
							<img src={asset(p.image)} alt={p.imageAlt} loading="lazy" />
						{/if}
					</div>
					<div class="pg-pillar__copy">
						<h3 class="pg-pillar__label">{p.label}</h3>
						{#if p.id === 'pattern'}
							<p class="pg-small">
								This one is live: the same encoder the device runs, stamping the current time
								into a real pattern on this page.
							</p>
						{/if}
						<dl class="pg-facts">
							{#each p.highlights as h}
								<div>
									<dt>{h.lead}</dt>
									<dd>{h.text}</dd>
								</div>
							{/each}
						</dl>
					</div>
				</article>
			{/each}
		</div>
		<p class="pg-body">
			Decoding a captured pattern does two things at once: it returns the time, place and
			authenticity context to whoever submitted the image, and it appends a leaf to an append-only
			transparency log, in the same lineage as certificate transparency. Because every capture of
			the same pattern points at the same moment, corroboration becomes a lookup instead of an
			investigation: submit one clip, find every other verified capture of that moment.
		</p>
	</section>

	<!-- ───────────── validation ───────────── -->
	<section class="pg-wrap">
		<p class="pg-eyebrow">Validation</p>
		<ol class="pg-claims">
			{#each claims as c, i}
				<li><span class="pg-claims__n">{i + 1}</span>{c}<span class="pg-claims__check" aria-hidden="true">✓</span></li>
			{/each}
		</ol>

		<h3 class="pg-h3">Expert interviews <span class="pg-label">claims 1 · 2</span></h3>
		<div class="pg-people">
			{#each people as person}
				<figure>
					<img src={asset(person.portrait)} alt={person.name} loading="lazy" data-no-lightbox />
					<figcaption>
						<strong>{person.name}</strong>
						<span>{person.org}</span>
					</figcaption>
				</figure>
			{/each}
		</div>

		<h3 class="pg-h3">Field validation <span class="pg-label">claim 3</span></h3>
		<p class="pg-body">
			I took the working prototype around London and photographed it in real conditions. Every
			capture decoded to the correct time and place, and the replayed pattern was rejected by the
			counter check.
		</p>
		<div class="pg-wall">
			{#each captures as c, i}
				<figure
					class:is-hot={hovered === c.n}
					class:is-replay={c.dupOf}
					onmouseenter={() => (hovered = c.n)}
					onmouseleave={() => (hovered = null)}
				>
					<img src={asset(`field-capture-${String(c.n).padStart(2, '0')}.webp`)} alt="Field capture {c.n}: the prototype photographed around London" loading="lazy" />
					<figcaption>
						<span class="pg-wall__leaf">{c.dupOf ? `Replay · dup ${c.dupOf}` : `Leaf #${c.leaf}`}</span>
						<span>dev {c.device} · ctr {c.counter}</span>
						<span>{fmtTime(c.observed)} · {c.lat.toFixed(4)}, {c.lon.toFixed(4)}</span>
					</figcaption>
				</figure>
			{/each}
		</div>
		<figure class="pg-map" style:aspect-ratio={fieldMap.aspect}>
			<div class="pg-map__base" role="img" aria-label="Map of south-west London with the decoded captures pinned" style:background-image="url({asset(fieldMap.image)})"></div>
			{#each captures as c}
				{@const at = pin(c.lat, c.lon)}
				<button
					type="button"
					class="pg-map__pin"
					class:is-hot={hovered === c.n}
					class:is-replay={c.dupOf}
					style:left="{at.x}%"
					style:top="{at.y}%"
					style:--thumb="url({asset(`field-capture-${String(c.n).padStart(2, '0')}.webp`)})"
					onmouseenter={() => (hovered = c.n)}
					onmouseleave={() => (hovered = null)}
					onfocus={() => (hovered = c.n)}
					onblur={() => (hovered = null)}
					aria-label="Capture {c.n}, {c.dupOf ? 'rejected replay' : `leaf ${c.leaf}`}"
				></button>
			{/each}
			<figcaption class="pg-caption">Each decode lands as a pin in the evidence browser.</figcaption>
		</figure>
	</section>

	<!-- ───────────── prototyping ───────────── -->
	<section class="pg-wrap">
		<p class="pg-eyebrow">Prototyping</p>
		{#each prototyping as lane}
			<div class="pg-lane">
				<div class="pg-lane__head">
					<h3 class="pg-h3">{lane.name}</h3>
					<p class="pg-small">{lane.blurb}</p>
				</div>
				<div class="pg-lane__grid">
					{#each lane.shots as [file, label]}
						<figure>
							<img src={asset(file)} alt={`${lane.name}: ${label}`} loading="lazy" />
							<figcaption>{label}</figcaption>
						</figure>
					{/each}
				</div>
			</div>
		{/each}
	</section>

	<!-- ───────────── conclusion ───────────── -->
	<section class="pg-conclusion">
		<p class="pg-conclusion__statement">PIGEON makes corroboration</p>
		<p class="pg-conclusion__payoff">
			<span class="pg-conclusion__word">SEARCHABLE</span>
			<Multitruchet
				preset="text"
				text="SEARCHABLE"
				color="--color-accent"
				bg="transparent"
				fg="transparent"
				fontFamily="var(--font-display)"
				fontWeight={800}
				tracking={0.06}
				textLineWeight={0.2}
				rootGrid={40}
				maxDepth={2}
				class="pg-conclusion__fill"
			/>
		</p>
	</section>

	<!-- ───────────── version two teaser ───────────── -->
	<!-- Deliberately says nothing about what V2 is: the renders do the talking. -->
	<section class="pg-wrap pg-v2" aria-label="PIGEON version two, in the works">
		<div class="pg-v2__head">
			<span class="pg-v2__status">In the works</span>
			<p class="pg-v2__title">V2</p>
		</div>
		<div class="pg-v2__shots">
			<img src={asset('v2-exploded.webp')} alt="Exploded render of PIGEON version two" loading="lazy" />
			<img src={asset('v2-back.webp')} alt="Render of the back of PIGEON version two" loading="lazy" />
		</div>
	</section>

	<!-- ───────────── close ───────────── -->
	<footer class="pg-wrap pg-foot">
		<div class="pg-foot__deck">
			<p class="pg-eyebrow">The presentation</p>
			<p class="pg-body">
				This page follows my final presentation. The deck itself is still up, with its deep dives on
				the pattern, the ledger and the red-teaming. It is desktop-only: move through it with the
				arrow keys and open deep dives with the spacebar.
			</p>
			<a class="pg-btn pg-btn--fill" href={deck} target="_blank" rel="noopener noreferrer">Open the presentation ↗</a>
		</div>
		<div>
			<p class="pg-eyebrow">Thank you</p>
			<ul class="pg-thanks">
				{#each acknowledgements as [name, role]}
					<li><strong>{name}</strong><span>{role}</span></li>
				{/each}
			</ul>
		</div>
	</footer>
</div>
