<script lang="ts">
	/**
	 * ScrollFizzle — the deck's signature fizzle for an animated image or still,
	 * as a self-contained, scroll-driven component.
	 *
	 * Drop in a source and it dissolves into the truchet grid tile-by-tile as
	 * `progress` goes 0→1 — the same transition language as the Hook slide's mosaic
	 * scene, with NO frame extraction. An ANIMATED IMAGE (gif / animated WebP /
	 * APNG) is decoded to frames once via WebCodecs' ImageDecoder, giving random
	 * access to every frame: `clip` scrubs them by scroll, or they free-run when
	 * `clip` is omitted. A still image is sampled once. (Raw video — mp4/webm — is
	 * NOT supported: it can't be frame-seeked from a buffer, which is what the
	 * scrub needs. Encode clips as animated WebP — small and full-colour.)
	 *
	 *   <!-- a clip whose frames scrub WITH the scroll, dimming as you pass -->
	 *   <ScrollFizzle src={clip} progress={revealP} clip={clipP} opacity={mo} />
	 *
	 *   <!-- a clip that free-runs under a tweened fizzle (omit `clip`) -->
	 *   <ScrollFizzle src={clip} progress={p} />
	 *
	 *   <!-- a still photo mosaic, same fizzle, no animation cost -->
	 *   <ScrollFizzle src={photo} progress={p} />
	 *
	 * It draws to its OWN <canvas> (it does NOT touch the deck-wide background
	 * store), so multiple instances are independent and it composites over
	 * whatever is behind it. Revealed tiles are opaque; unrevealed tiles are
	 * transparent (the field / page shows through), so a fizzle-in reads as the
	 * background pattern resolving into the picture.
	 *
	 * `opacity` (and `class`) style the WHOLE component, so the caller can fade or
	 * transform it independently of the fizzle `progress` — e.g. resolve the
	 * mosaic at one scroll point, then dim the resolved image at a later one.
	 *
	 * Performance: re-tiling 10k+ cells per frame can't hit 60fps, so geometry is
	 * prepared ONCE (prepareImageReveal); each frame only (a) recolours the tiles
	 * whose sampled colour actually changed and (b) draws/erases the handful of
	 * tiles that cross the dissolve threshold. (Uses the core fast-path helpers
	 * prepareImageReveal / drawRevealTile, driven off a live source.)
	 *
	 * Like Multitruchet, the canvas is absolutely positioned; the host fills its
	 * positioned parent, which gives it its size.
	 */
	import { onMount } from "svelte";
	import {
		prepareImageReveal,
		sampleColorizeFrames,
		drawRevealTile,
		eraseRevealTile,
		revealCount,
		resolveCssColor,
		buildConfig,
		type PreparedReveal,
		type MorphStyle,
		type CanvasSource,
	} from "./multitruchet";

	// Minimal shape of the parts of WebCodecs' ImageDecoder we use (not in every
	// TS lib target). A decoded frame's `image` is a VideoFrame, which createImage-
	// Bitmap accepts and which exposes close() to release the decoder's memory.
	type GifFrame = {
		image: CanvasImageSource & { close?: () => void };
		duration?: number;
	};
	type GifDecoder = {
		completed: Promise<void>;
		tracks: { ready: Promise<void>; selectedTrack?: { frameCount?: number } };
		decode: (opts: { frameIndex: number }) => Promise<GifFrame>;
		close?: () => void;
	};

	let {
		/** Source URL: an animated image (gif / animated WebP / APNG) or a still
		 *  image. Raw video (mp4/webm) is not supported — encode as animated WebP. */
		src,
		/** Dissolve amount in [0,1] — drive from scroll for the reveal. */
		progress = 0,
		/** Clip scrub position in [0,1] for an animated source: which frame the
		 *  mosaic shows. Drive from scroll to tie playback to scroll position. Leave
		 *  undefined to let it free-run on its own timeline; ignored for a still. */
		clip = undefined,
		/** Master opacity of the whole component, [0,1]. Drive from scroll to fade
		 *  the resolved mosaic independently of `progress`. */
		opacity = 1,
		/** How the source is fitted into the canvas. */
		fit = "cover",
		/** Order in which cells flip on as `progress` grows. */
		style = "fizzle",
		/** Grid + subdivision (defaults suit a hero-sized photo). Match the deck
		 *  field (rootGrid 66 / maxDepth 1) to register tile-for-tile with it. */
		rootGrid = 28,
		maxDepth = 2,
		detailThreshold,
		/** The dark/back colour inside each motif (the field's tone). */
		bg = "--color-bg",
		/** Seed for the motif assignment + fizzle order. */
		seed = 1,
		/** Pause the per-frame resample when the clip should sit still. */
		paused = false,
		/** Free-run playback: loop forever (true), or play ONCE and hold the last
		 *  frame (false). Ignored when scrubbed by `clip`. Unpausing (paused→false)
		 *  restarts the playthrough from frame 0, so a play-once clip can replay. */
		loop = true,
		class: klass = "",
	}: {
		src: string;
		progress?: number;
		clip?: number;
		opacity?: number;
		fit?: "cover" | "contain" | "stretch";
		style?: MorphStyle;
		rootGrid?: number;
		maxDepth?: number;
		detailThreshold?: number;
		bg?: string;
		seed?: number;
		paused?: boolean;
		loop?: boolean;
		class?: string;
	} = $props();

	// Decodable animated formats — ImageDecoder gives random access to their frames
	// (scrub by `clip` or free-run). Anything else is sampled once as a still. (A
	// static .webp simply decodes to a single frame; .png/.jpg stay on the cheap
	// still path rather than paying a decode each.)
	const isAnimated = $derived(/\.(gif|webp)(\?|#|$)/i.test(src));

	let host: HTMLElement;
	let canvas: HTMLCanvasElement;
	let media = $state<HTMLImageElement | null>(null);

	// Imperative engine, set up once on mount; props are pushed in via $effect.
	let api:
		| {
				setProgress: (p: number) => void;
				setClip: (c: number | undefined) => void;
				setSource: () => void;
				setPaused: (p: boolean) => void;
				setLoop: (l: boolean) => void;
		  }
		| undefined;

	onMount(() => {
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const reduced =
			typeof window !== "undefined" &&
			window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

		let prepared: PreparedReveal | null = null;
		let cfg: ReturnType<typeof buildConfig> | null = null;
		let curColors: Uint8ClampedArray | null = null; // colours currently on tiles
		let drawn = 0; // tiles painted (prefix of prepared.tiles)
		let progressVal = progress;
		let clipVal: number | undefined = clip; // scroll-linked frame scrub, if any
		let pausedVal = paused;
		let loopVal = loop; // free-run: loop forever, or play once + hold last frame
		let bgFill = resolveCssColor(canvas, bg) || "#0a0a0a";
		let visible = false;
		let key = ""; // identity of what's prepared (rebuild only when it changes)

		const dpr = () =>
			Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);

		const sizeCanvas = () => {
			const r = canvas.getBoundingClientRect();
			canvas.width = Math.max(1, Math.round(r.width * dpr()));
			canvas.height = Math.max(1, Math.round(r.height * dpr()));
		};

		// True once the media has intrinsic dimensions and a drawable frame.
		const mediaReady = () => !!media && media.complete && media.naturalWidth > 0;

		// Re-sample a source into a per-cell colour buffer (cheap: a small
		// downscaled raster, not a re-tile).
		const sample = (s: CanvasSource): Uint8ClampedArray | null =>
			cfg ? (sampleColorizeFrames(cfg, [s])[0] ?? null) : null;

		// ── Animated-image frames (WebCodecs) ─────────────────────────────
		// An <img> can't be seeked to an arbitrary frame (and a gif's animation is
		// paused while the element isn't painted — ours is opacity:0). So to scrub
		// by scroll we decode EVERY frame ONCE via ImageDecoder up front, pre-sampling
		// each into a tiny colour buffer, then pick the frame by `clip` (scroll-
		// linked) or by wall-clock (free-run). Falls back to a single live <img>
		// sample where ImageDecoder is unavailable.
		// Typed loosely: ImageDecoder isn't in every TS lib target, and we only
		// touch it behind a runtime presence check.
		const ImageDecoderCtor = (
			globalThis as unknown as { ImageDecoder?: new (init: unknown) => GifDecoder }
		).ImageDecoder;
		let gifColors: Uint8ClampedArray[] | null = null; // per-frame colour buffers
		let gifEnds: number[] | null = null; // cumulative frame end times (ms)
		let gifTotal = 0; // loop length (ms), for free-run mode
		let multiFrame = false; // decoded source actually has >1 frame
		let clock = 0; // wall-clock anchor for free-run playback
		const nowMs = () =>
			typeof performance !== "undefined" ? performance.now() : Date.now();
		const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

		const guessType = (s: string) => {
			const ext = s.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
			return ext === "png"
				? "image/png"
				: ext === "webp"
					? "image/webp"
					: ext === "avif"
						? "image/avif"
						: "image/gif";
		};

		// Colour buffer for this instant. Decoded frames: pick by `clip` (scroll-
		// linked) when supplied, else advance by wall-clock (free-run). No frames yet
		// (still decoding, or ImageDecoder absent): sample the live <img> once.
		const frameColors = (): Uint8ClampedArray | null => {
			if (gifColors && gifColors.length) {
				const n = gifColors.length;
				let i: number;
				if (clipVal != null) {
					i = Math.round(clamp01(clipVal) * (n - 1));
				} else if (gifEnds && gifTotal > 0) {
					// Free-run: loop the timeline, or (loop=false) clamp at the end so
					// the clip plays through ONCE and holds on its last frame.
					const elapsed = nowMs() - clock;
					const t = loopVal ? elapsed % gifTotal : Math.min(elapsed, gifTotal);
					i = 0;
					while (i < gifEnds.length - 1 && t >= gifEnds[i]) i++;
				} else {
					i = 0;
				}
				return gifColors[i];
			}
			return media ? sample(media) : null;
		};

		const decodeGif = async (forKey: string) => {
			if (!cfg || !ImageDecoderCtor) return;
			try {
				const resp = await fetch(src);
				const data = await resp.arrayBuffer();
				const type = resp.headers.get("Content-Type") || guessType(src);
				const dec = new ImageDecoderCtor({ data, type });
				// frameCount is only known once the track metadata is parsed — waiting
				// on `completed` alone can read it as undefined and decode just 1 frame
				// (the freeze bug). Gate on tracks.ready.
				await dec.tracks.ready;
				await dec.completed;
				const count: number = dec.tracks.selectedTrack?.frameCount ?? 1;
				const colors: Uint8ClampedArray[] = [];
				const ends: number[] = [];
				let acc = 0;
				for (let i = 0; i < count; i++) {
					if (key !== forKey || !cfg) {
						dec.close?.();
						return; // a rebuild superseded this decode → abandon it
					}
					const { image, duration } = await dec.decode({ frameIndex: i });
					const bmp = await createImageBitmap(image);
					const buf = sampleColorizeFrames(cfg, [bmp])[0];
					if (buf) colors.push(buf);
					bmp.close?.();
					image.close?.();
					const ms = duration ? duration / 1000 : 100; // µs → ms
					acc += ms > 0 ? ms : 100;
					ends.push(acc);
				}
				dec.close?.();
				if (key !== forKey || colors.length === 0) return;
				gifColors = colors;
				gifEnds = ends;
				gifTotal = acc || 1;
				multiFrame = colors.length > 1;
				clock = nowMs();
				// Paint the current frame immediately (covers scroll-linked use where
				// the loop is idle), and start the loop for free-run use.
				applyFrame();
				if (visible) startLoop();
			} catch {
				/* leave the live-element fallback in place */
			}
		};

		const prepare = () => {
			if (!media || !mediaReady() || canvas.width === 0) return;
			bgFill = resolveCssColor(canvas, bg) || "#0a0a0a";
			cfg = buildConfig(canvas.width, canvas.height, {
				bg: "transparent",
				rootGrid,
				maxDepth,
				...(detailThreshold != null ? { detailThreshold } : {}),
				imageFit: fit,
				maskRevealStyle: style,
				seed,
				layers: [{ type: "image", image: media, color: "#fff", colorize: true }],
			});
			prepared = prepareImageReveal(cfg);
			// prepareImageReveal baked frame-0 colours onto the tiles; mirror that in
			// our colour buffer so the per-frame diff has a correct baseline.
			curColors = sample(media);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			drawn = 0;
			drawTo(progressVal);
			// Animated source: decode its frames for THIS grid size (the colour buffers
			// are leaf-grid-sized, so they must be re-sampled when the size changes).
			gifColors = null;
			gifEnds = null;
			gifTotal = 0;
			multiFrame = false;
			if (isAnimated && ImageDecoderCtor) void decodeGif(key);
		};

		// Apply a fresh colour buffer: recolour only tiles whose cell colour moved,
		// repainting the ones already on screen; the rest carry the colour forward
		// for whenever they reveal.
		const recolor = (b: Uint8ClampedArray | null) => {
			if (!prepared || !curColors || !b) return;
			const a = curColors;
			const tiles = prepared.tiles;
			for (let i = 0; i < tiles.length; i++) {
				const t = tiles[i];
				const c = t.cell * 4;
				if (a[c] !== b[c] || a[c + 1] !== b[c + 1] || a[c + 2] !== b[c + 2]) {
					t.color = `rgb(${b[c]},${b[c + 1]},${b[c + 2]})`;
					if (i < drawn) drawRevealTile(ctx, t, bgFill);
				}
			}
			curColors = b;
		};

		// Bring the painted prefix in line with the dissolve amount `r`.
		const drawTo = (r: number) => {
			if (!prepared) return;
			const target =
				r <= 0
					? 0
					: r >= 1
						? prepared.tiles.length
						: revealCount(prepared.thresholds, r);
			if (target === 0) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			} else if (target > drawn) {
				for (let i = drawn; i < target; i++)
					drawRevealTile(ctx, prepared.tiles[i], bgFill);
			} else if (target < drawn) {
				for (let i = target; i < drawn; i++) eraseRevealTile(ctx, prepared.tiles[i]);
			}
			drawn = target;
		};

		// Repaint to the current source frame + reveal. Used when the loop is idle
		// (scroll-linked clip, or a still image): the prop setters call it directly.
		const applyFrame = () => {
			recolor(frameColors());
			drawTo(progressVal);
		};

		// The rAF loop FREE-RUNS a multi-frame source that has NO scroll-linked
		// `clip`. A source scrubbed by `clip` is driven by the prop instead, so it
		// needs no loop. Reduced-motion / paused / a still source stops free-run.
		const animated = () =>
			!reduced && !pausedVal && multiFrame && clipVal == null;

		let raf = 0;
		let running = false;
		const tick = () => {
			if (!running) return;
			recolor(frameColors());
			drawTo(progressVal);
			// A play-once clip that has reached its end holds the last frame — no need
			// to keep ticking once it's there.
			if (!loopVal && gifTotal > 0 && nowMs() - clock >= gifTotal) {
				stopLoop();
				return;
			}
			raf = requestAnimationFrame(tick);
		};
		const startLoop = () => {
			if (running || !animated()) return;
			running = true;
			raf = requestAnimationFrame(tick);
		};
		const stopLoop = () => {
			running = false;
			if (raf) cancelAnimationFrame(raf);
			raf = 0;
		};

		// Size before the first prepare so tiles are built at the real resolution.
		sizeCanvas();

		const tryPrepare = () => {
			const k = `${src}|${fit}|${style}|${rootGrid}|${maxDepth}|${seed}|${canvas.width}x${canvas.height}`;
			if (k === key) return;
			if (!mediaReady()) return;
			key = k;
			prepare();
		};

		// Media load → (re)build; first sample needs a decoded frame.
		const onReady = () => {
			tryPrepare();
			if (visible) startLoop();
		};

		const io = new IntersectionObserver(
			([entry]) => {
				visible = entry.isIntersecting;
				if (visible) {
					tryPrepare();
					startLoop();
				} else {
					stopLoop();
				}
			},
			{ rootMargin: "100% 0px" },
		);
		io.observe(host);

		let first = true;
		const ro = new ResizeObserver(() => {
			if (first) {
				first = false; // fires once immediately; already sized above
				return;
			}
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				sizeCanvas();
				key = ""; // force rebuild at the new size
				tryPrepare();
				if (visible) startLoop();
			});
		});
		ro.observe(canvas);

		api = {
			setProgress: (p: number) => {
				progressVal = p;
				if (!running) drawTo(p); // loop idle (still image / off-screen): apply now
			},
			setClip: (c: number | undefined) => {
				clipVal = c;
				// Scroll-linked scrub: the loop is idle in this mode, so the new frame
				// has to be painted here (the free-run loop would otherwise own it).
				if (!running) applyFrame();
			},
			setSource: () => {
				key = ""; // src/fit/grid changed: rebuild on the next ready/visible
				if (mediaReady()) {
					tryPrepare();
					if (visible) startLoop();
				}
			},
			setPaused: (p: boolean) => {
				pausedVal = p;
				if (p) {
					stopLoop();
				} else {
					// Restart the playthrough from frame 0 — this is what gates a
					// play-once clip to begin exactly when it's unpaused (and lets it
					// replay if the slide is scrolled back and re-entered).
					clock = nowMs();
					if (visible) startLoop();
				}
			},
			setLoop: (l: boolean) => {
				loopVal = l;
				// Re-looping a clip that had stopped at its end needs the loop restarted.
				if (l && visible) startLoop();
			},
		};

		// The <img> is a stable element (only its src changes). Rebuild when a new
		// src loads; also poke once next frame for an already-cached image, where no
		// load event fires.
		media?.addEventListener("load", onReady);
		requestAnimationFrame(onReady);

		return () => {
			stopLoop();
			io.disconnect();
			ro.disconnect();
			media?.removeEventListener("load", onReady);
			api = undefined;
		};
	});

	// Push reactive prop changes into the imperative engine.
	$effect(() => {
		api?.setProgress(progress);
	});
	$effect(() => {
		api?.setClip(clip);
	});
	$effect(() => {
		// Touch the identity-bearing props so a change rebuilds the tiling.
		void [src, fit, style, rootGrid, maxDepth, seed];
		api?.setSource();
	});
	$effect(() => {
		api?.setPaused(paused);
	});
	$effect(() => {
		api?.setLoop(loop);
	});
</script>

<div class="fizzle {klass}" style:opacity bind:this={host} aria-hidden="true">
	<!-- Hidden source <img>: the loader + geometry source (sampled once) and the
	     decode fallback. Animated frames are scrubbed from the ImageDecoder buffers,
	     not this element. opacity:0 (not display:none) so it stays decodable. -->
	<img bind:this={media} {src} class="fizzle__src" alt="" />
	<canvas bind:this={canvas} class="fizzle__canvas"></canvas>
</div>

<style>
	.fizzle {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.fizzle__src {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		pointer-events: none;
	}
	.fizzle__canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		z-index: 1;
		pointer-events: none;
	}
</style>
