<script lang="ts">
	import type { FreeformPageProps } from '.';
	import PigeonField from '$lib/pigeon/PigeonField.svelte';
	import ScrollFizzle from '$lib/pigeon/ScrollFizzle.svelte';
	import Multitruchet from '$lib/pigeon/Multitruchet.svelte';
	import LivePattern from '$lib/pigeon/LivePattern.svelte';
	import GapReveal from '$lib/pigeon/GapReveal.svelte';
	import { autoloop, progress, rise, span, smooth } from '$lib/pigeon/scroll';
	import caseScene from '$lib/pigeon/assets/case-scene.webp';
	import revealClip from '$lib/pigeon/assets/reveal-clip.webp';
	import {
		caseStudy,
		toolFamilies,
		quadrant,
		pillars,
		claims,
		captures,
		fieldMap,
		prototyping,
		acknowledgements,
		floodNumbers,
		type Evidence
	} from '$lib/pigeon/content';

	let { asset }: FreeformPageProps = $props();

	// The page wears the presentation's look (see the .pigeon rules in log.css) and
	// follows the deck's story top to bottom.

	// Case-study opener: the scene photo resolves out of the pattern as it scrolls in.
	let sceneP = $state(0);
	// The PIGEON reveal: a tall section with a sticky frame, driven by scroll.
	let revealP = $state(0);
	// p runs from the section entering (0) to its end (1); it pins at ~0.31.
	const fizzle = $derived(span(revealP, 0.08, 0.55));
	const v2Views = [
		{ src: 'v2-front.webp', alt: 'The PIGEON device from the front' },
		{ src: 'v2-side.webp', alt: 'The PIGEON device from the side' },
		{ src: 'v2-rear.webp', alt: 'The PIGEON device from the back' }
	];
	const wrist = $derived(smooth(span(revealP, 0.55, 0.72)));

	// Case study as a flood: every piece of evidence is a tile on its lane at the time it
	// surfaced, on a log time axis from the shot (the first hours get most of the width),
	// stacking up where they crowd. A playhead sweeps it as the pinned section scrolls; the
	// newest item it has passed is shown large below.
	const compact = (n: number) =>
		n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}K` : `${n}`;
	const SHOT_H = 9 + 37 / 60; // 9:37 am, Jan 7, Minneapolis time
	const SPAN_H = 9 * 24 - SHOT_H; // to midnight, Jan 16
	const LOG_SPAN = Math.log1p(SPAN_H);
	const xOf = (h: number) => (Math.log1p(Math.max(0, h)) / LOG_SPAN) * 100; // h = hours since the shot
	const hOf = (x: number) => Math.expm1((x / 100) * LOG_SPAN);
	const day0 = Date.parse('Jan 7, 2026');
	const clock = (hourOfDay: number) => {
		const m = Math.round((hourOfDay * 60) / 5) * 5;
		const hh = Math.floor(m / 60) % 24;
		return `${hh % 12 || 12}:${String(m % 60).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
	};
	const flood = (() => {
		const out: { item: Evidence; lane: number; x: number; when: string }[] = [];
		caseStudy.forEach((stop, lane) => {
			const days = stop.items.map((it) => Math.round((Date.parse(it.date) - day0) / 864e5));
			// Items with no known time are spread evenly across the rest of their day; the
			// panel then shows only their date, so no time is claimed for them.
			const untimed = new Map<number, number>();
			days.forEach((d, i) => stop.items[i].hour === undefined && untimed.set(d, (untimed.get(d) ?? 0) + 1));
			const seen = new Map<number, number>();
			stop.items.forEach((item, i) => {
				const d = days[i];
				let hour = item.hour;
				if (hour === undefined) {
					const [from, to] = d === 0 ? [12, 21] : [6, 22];
					const j = seen.get(d) ?? 0;
					seen.set(d, j + 1);
					hour = from + ((to - from) * (j + 0.5)) / (untimed.get(d) ?? 1);
				}
				const when = item.hour !== undefined ? `${clock(item.hour)} · ${item.date}` : item.date;
				out.push({ item, lane, x: xOf(d * 24 + hour - SHOT_H), when });
			});
		});
		return out.sort((a, b) => a.x - b.x || a.lane - b.lane);
	})();
	const floodTicks = [
		{ h: 0, label: 'Shot · 9:37 AM' },
		{ h: 1, label: '+1 h', minor: true },
		{ h: 6, label: '+6 h' },
		{ h: 24 - SHOT_H, label: 'Jan 8', minor: true },
		{ h: 72 - SHOT_H, label: 'Jan 10' },
		{ h: 168 - SHOT_H, label: 'Jan 14' }
	].map((t) => ({ ...t, x: xOf(t.h) }));

	// Stacking: tiles are sized from the track width, and each lane packs its tiles into
	// rows so nothing hides another completely.
	let trackW = $state(1100);
	const tile = $derived(Math.max(24, Math.min(44, trackW * 0.034)));
	const stack = $derived.by(() => {
		const w = (tile / trackW) * 100 * 1.04;
		const level: number[] = new Array(flood.length).fill(0);
		const rows = caseStudy.map(() => [] as number[]);
		flood.forEach((f, n) => {
			const ends = rows[f.lane];
			let l = ends.findIndex((e) => e <= f.x);
			if (l < 0) l = ends.push(0) - 1;
			ends[l] = f.x + w;
			level[n] = l;
		});
		return { level, rows: rows.map((r) => r.length) };
	});

	let floodP = $state(0);
	let floodStill = $state(false); // reduced motion: everything shown, no sweep
	const head = $derived(floodStill ? 100 : span(floodP, 0.04, 0.88) * 100);
	const shown = $derived(flood.filter((f) => f.x <= head).length);
	let picked = $state<number | null>(null);
	const focusIdx = $derived(picked ?? (shown > 0 ? shown - 1 : null));
	const focus = $derived(focusIdx === null ? null : flood[focusIdx]);
	const headLabel = $derived.by(() => {
		const abs = SHOT_H + hOf(head); // hours from midnight, Jan 7
		const d = Math.floor(abs / 24);
		return d === 0 ? `Jan 7 · ${clock(abs)}` : `Jan ${7 + d}`;
	});
	$effect(() => {
		floodStill = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
	});

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
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..900&family=IBM+Plex+Mono:wght@300;400;500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{#snippet redacted(text: string)}
	{#each text.split(/(▇[▇ ]*▇|▇)/) as part}
		{#if part.startsWith('▇')}<span class="pg-redact" aria-label="name withheld">{part}</span>{:else}{part}{/if}
	{/each}
{/snippet}

<div class="pigeon">
	<!-- ───────────── title ───────────── -->
	<section class="pg-hero">
		<PigeonField />
		<a class="pg-hero__back" href="/projects">← projects</a>
		<div class="pg-hero__foot">
			<div class="pg-hero__lockup">
				<h1 class="pg-hero__title">PIGEON</h1>
				<p class="pg-hero__sub">A living pattern that makes corroboration searchable.</p>
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

	<!-- ───────────── the device ───────────── -->
	<!-- The product first, no explanation yet: the story that follows earns it. The renders
	     sit on pure black and are screen-blended, so the black drops into the page and the
	     device floats in front of the outlined V2. -->
	<section class="pg-v2" aria-label="The PIGEON device">
		<div class="pg-wrap pg-v2__stage">
			<p class="pg-v2__title" aria-hidden="true">V2</p>
			<img class="pg-v2__hero" src={asset('v2-hero.webp')} alt="Render of the PIGEON device" />
		</div>
		<div class="pg-wrap pg-v2__views">
			{#each v2Views as v, i (v.src)}
				<figure class="pg-v2__view" use:rise style:--i={i}>
					<img src={asset(v.src)} alt={v.alt} loading="lazy" />
				</figure>
			{/each}
		</div>
		<figure class="pg-wrap pg-v2__parts" use:rise data-no-lightbox>
			<video
				use:autoloop
				src={asset('v2-explode.mp4')}
				poster={asset('v2-explode-poster.webp')}
				autoplay
				muted
				loop
				playsinline
				disablepictureinpicture
				aria-label="The PIGEON device coming apart into its parts and back together"
			></video>
		</figure>
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

	<!-- The scale, in numbers, before the flood itself. -->
	<section class="pg-wrap pg-tally" aria-label="The first days in numbers">
		{#each floodNumbers as n}
			<a class="pg-tally__item" href={n.source} target="_blank" rel="noopener noreferrer">
				<b>{n.value}</b>
				<span>{n.label}</span>
			</a>
		{/each}
	</section>

	<!-- The first days as a flood: four lanes on one log time axis from the shot, every piece
	     of evidence a tile at the time it surfaced, stacking where they crowd. The section
	     pins while a playhead sweeps it; the newest item it has passed is shown large
	     underneath, so only one thing is ever read at a time. -->
	<section class="pg-flood" use:progress={{ onchange: (p) => (floodP = p) }} style:--tw="{tile}px">
		<div class="pg-flood__frame">
			<div class="pg-wrap pg-flood__inner">
				<p class="pg-flood__sample">
					{flood.length} pieces I collected: a small sample of a far larger flood.
				</p>
				<div class="pg-flood__chart" role="group" aria-label="Evidence from the first days, by kind" bind:clientWidth={trackW}>
					{#each caseStudy as stop, lane}
						<div class="pg-flood__lane" class:is-live={focus?.lane === lane}>
							<p class="pg-flood__label">
								<b>{stop.number}</b>
								{stop.label}
								<span>{stop.stat}</span>
							</p>
							<div class="pg-flood__track" style:--rows={stack.rows[lane]}>
								{#each flood as f, n}
									{#if f.lane === lane}
										<button
											type="button"
											class="pg-flood__thumb"
											class:is-in={f.x <= head}
											class:is-focus={focusIdx === n}
											class:is-text={f.item.type === 'post'}
											style:left="{f.x}%"
											style:--lv={stack.level[n]}
											aria-label="{f.item.caption}, {f.when}"
											aria-pressed={focusIdx === n}
											onmouseenter={() => (picked = n)}
											onmouseleave={() => (picked = null)}
											onfocus={() => (picked = n)}
											onblur={() => (picked = null)}
											onclick={() => (picked = n)}
										>
											{#if f.item.type === 'tweet'}
												<span class="pg-flood__post" data-platform={f.item.platform ?? 'x'}>
													<img src={asset(f.item.avatar)} alt="" data-no-lightbox />
													<b>{f.item.metrics.views ? compact(f.item.metrics.views) : compact(f.item.metrics.likes)}</b>
												</span>
											{:else if f.item.type === 'post'}
												<span class="pg-flood__chip">
													<i>{f.item.tag === 'X' ? '𝕏' : f.item.tag}</i>
													{#if f.item.metrics?.views}<b>{compact(f.item.metrics.views)}</b>{/if}
												</span>
											{:else}
												<img src={asset(f.item.src)} alt="" loading="lazy" data-no-lightbox />
											{/if}
										</button>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
					<div class="pg-flood__axis" aria-hidden="true">
						{#each floodTicks as t}
							<span class:is-minor={t.minor} style:left="{t.x}%">{t.label}</span>
						{/each}
					</div>
					<span class="pg-flood__head" style:left="{head}%" style:--edge={head > 82 ? 1 : 0} aria-hidden="true">
						<em>{headLabel}</em>
					</span>
				</div>

				<div class="pg-flood__focus">
					{#each flood as f, n}
						{@const on = focusIdx === n}
						<figure class="pg-flood__card" class:is-on={on} aria-hidden={!on}>
							<div class="pg-flood__media">
								{#if f.item.type === 'tweet'}
									<article class="pg-tweet" data-platform={f.item.platform ?? 'x'}>
										<header>
											<img class="pg-tweet__av" src={asset(f.item.avatar)} alt="" data-no-lightbox />
											<span class="pg-tweet__who">
												<strong>{f.item.name}</strong>
												<span>@{f.item.handle}</span>
											</span>
											<span class="pg-tweet__net">{f.item.platform === 'truthsocial' ? 'T' : '𝕏'}</span>
										</header>
										<p class="pg-tweet__text">{f.item.text}…</p>
										<p class="pg-tweet__time">{f.item.timestamp}</p>
										<p class="pg-tweet__stats">
											<span><b>{compact(f.item.metrics.reposts)}</b> reposts</span>
											<span><b>{compact(f.item.metrics.likes)}</b> likes</span>
											{#if f.item.metrics.views}<span><b>{compact(f.item.metrics.views)}</b> views</span>{/if}
										</p>
									</article>
								{:else if f.item.type === 'post'}
									<article class="pg-tweet pg-flood__report">
										<header>
											<span class="pg-tweet__who"><strong>{@render redacted(f.item.source)}</strong></span>
											<span class="pg-tweet__net">{f.item.tag === 'X' ? '𝕏' : f.item.tag}</span>
										</header>
										<p class="pg-tweet__text">{@render redacted(f.item.text ?? f.item.caption)}</p>
										<p class="pg-tweet__time">{f.when}</p>
										{#if f.item.metrics}
											<p class="pg-tweet__stats">
												{#if f.item.metrics.reposts}<span><b>{compact(f.item.metrics.reposts)}</b> reposts</span>{/if}
												{#if f.item.metrics.likes}<span><b>{compact(f.item.metrics.likes)}</b> likes</span>{/if}
												{#if f.item.metrics.views}<span><b>{compact(f.item.metrics.views)}</b> views</span>{/if}
											</p>
										{/if}
									</article>
								{:else}
									<img src={asset(f.item.src)} alt={f.item.alt} />
								{/if}
							</div>
							<figcaption>
								<b>{caseStudy[f.lane].number} {caseStudy[f.lane].label}</b>
								<span>{@render redacted(f.item.caption)}</span>
								<small>
									{@render redacted(f.item.source)} · {f.when}
									{#if f.item.type === 'post'}
										· <a href={f.item.url} target="_blank" rel="noopener noreferrer" tabindex={on ? 0 : -1}>{f.item.private ? 'fact-check' : 'source'}</a>
										{#if f.item.archiveUrl}
											· <a href={f.item.archiveUrl} target="_blank" rel="noopener noreferrer" tabindex={on ? 0 : -1}>archived</a>
										{/if}
										{#if f.item.debunkedBy && !f.item.private}
											· <a href={f.item.debunkedBy} target="_blank" rel="noopener noreferrer" tabindex={on ? 0 : -1}>debunked</a>
										{/if}
									{:else if f.item.type === 'tweet' && f.item.archiveUrl}
										· <a href={f.item.archiveUrl} target="_blank" rel="noopener noreferrer" tabindex={on ? 0 : -1}>archived</a>
									{/if}
								</small>
							</figcaption>
						</figure>
					{/each}
					{#if focus === null}
						<p class="pg-flood__hint">Scroll to play the first days.</p>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<section class="pg-wrap pg-case">
		<p class="pg-note">
			Official statements land within hours. The citizen footage that contradicts them was filmed
			at the moment itself, but surfaces in pieces. Over the next week a flood of doctored and
			misattributed media runs in parallel with the OSINT investigations, which start within hours
			but take days to settle what happened. Those days are where false narratives take hold.
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
			<ScrollFizzle src={revealClip} progress={fizzle} clip={fizzle} rootGrid={66} maxDepth={1} opacity={1 - 0.45 * wrist} />
			<div
				class="pg-reveal__wrist"
				role="img"
				aria-label="The PIGEON device worn on a wrist"
				style:opacity={wrist}
				style:background-image="url({asset('reveal-wrist.webp')})"
			></div>
		</div>
	</section>

	<section class="pg-wrap pg-demo">
		<p class="pg-eyebrow">Demo</p>
		<h2 class="pg-h2">Decoded from a single photo.</h2>
		<!-- svelte-ignore a11y_media_has_caption -->
		<video src={asset('decode-demo.mp4')} poster={asset('decode-demo-poster.webp')} controls preload="none" playsinline></video>
		<p class="pg-caption">The decoder: a phone photo of the device goes in; the time, place and device identity come out.</p>
	</section>

	<!-- ───────────── how it works ───────────── -->
	<section class="pg-wrap">
		<p class="pg-eyebrow">How it works</p>
		<p class="pg-body">
			PIGEON is a beacon built from three parts (a GNSS module, a microcontroller and
			an e-ink display). Its face shows a constantly refreshing
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
				<li>
					<span class="pg-claims__n">{i + 1}</span>
					<div class="pg-claims__body">
						{c.claim}
						<p class="pg-claims__evidence">{c.evidence}</p>
					</div>
					<span class="pg-claims__check" aria-hidden="true">✓</span>
				</li>
			{/each}
		</ol>

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

	<!-- ───────────── close ───────────── -->
	<footer class="pg-wrap pg-foot">
		<div>
			<p class="pg-eyebrow">Thank you</p>
			<ul class="pg-thanks">
				{#each acknowledgements as [name, role]}
					<li><strong>{name}</strong><span>{role}</span></li>
				{/each}
				<li><span>and many more who helped shape the direction</span></li>
			</ul>
		</div>
	</footer>
</div>
