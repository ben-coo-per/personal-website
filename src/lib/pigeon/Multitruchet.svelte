<script lang="ts">
	/**
	 * Multitruchet — a live truchet canvas (styleguide §2.3, §7).
	 *
	 * The flexible, animatable counterpart to PatternBg.svelte (which paints a
	 * locked PNG). Drive it as a background, a text fill, an image effect, or a
	 * standalone animation. It renders to a DPR-correct <canvas>, pauses when
	 * off-screen or hidden, and falls back to a single static frame under
	 * `prefers-reduced-motion`.
	 *
	 *   <!-- faint animated backdrop, like PatternBg but alive -->
	 *   <Multitruchet preset="background" intensity="hero" animate />
	 *
	 *   <!-- a word built out of motifs -->
	 *   <Multitruchet preset="text" text="PIGEON" fg="--color-red" />
	 *
	 *   <!-- an image dissolved into the pattern, transparent over content -->
	 *   <Multitruchet preset="image" {image} bg="transparent" />
	 *
	 * Colours accept design-token references (`'--color-red'`,
	 * `'var(--color-white)'`) and are resolved against this element.
	 *
	 * It is absolutely positioned (inset:0), so the parent must be positioned.
	 */
	import { onMount } from 'svelte';
	import {
		MultitruchetEngine,
		type EngineOptions,
		type PresetName,
		type Layer,
		type CanvasSource,
		type MorphStyle,
		type FamilyFlags
	} from './multitruchet';

	type Intensity = 'hero' | 'section' | 'subtle';

	let {
		// ── content ──────────────────────────────────────────────
		preset = 'background',
		/** Shorthand: add a single text layer. Ignored if `layers` is given. */
		text,
		/** Shorthand: add a single image layer. Ignored if `layers` is given. */
		image,
		/** Sample the image's real colours per tile (full-colour mosaic). */
		colorize,
		/** Full control over the mask stack (overrides `text`/`image`). */
		layers,

		// ── colour ───────────────────────────────────────────────
		/** Page background. `'transparent'` (default) composites over content. */
		bg = 'transparent',
		/** Foreground colour for non-layer (background) cells. */
		fg,
		/** Foreground colour for the `text`/`image` shorthand layer. */
		color = '--color-white',

		// ── grid / motif ─────────────────────────────────────────
		rootGrid,
		maxDepth,
		falloff,
		threshold,
		textLineWeight,
		bgLineWeight,
		families,
		bgMode,
		contourCount,
		noiseScale,
		noiseOctaves,

		// ── text / image sampling ────────────────────────────────
		fontFamily,
		fontWeight,
		fontStyle,
		tracking,
		imageFit,

		// ── seed / animation ─────────────────────────────────────
		seed = 1,
		morphStyle,
		morphJitter,
		/** Progressive mask reveal in [0,1] — drive from scroll for a dissolve. */
		maskReveal,
		maskRevealStyle,
		maskRevealJitter,
		animate = false,
		seeds,
		transitionMs,
		holdMs,
		easing,
		fps,
		dprCap,

		// ── presentation ─────────────────────────────────────────
		/** Map opacity to a `--pattern-opacity-*` token (PatternBg parity). */
		intensity,
		/** Explicit opacity (used when `intensity` is unset). */
		opacity = 1,
		/** Pause rendering entirely while off-screen. */
		pauseWhenHidden = true,
		class: klass = '',
		ariaHidden = true
	}: {
		preset?: PresetName;
		text?: string;
		image?: CanvasSource | null;
		colorize?: boolean;
		layers?: Layer[];
		bg?: string;
		fg?: string;
		color?: string;
		rootGrid?: number;
		maxDepth?: number;
		falloff?: number;
		threshold?: number;
		textLineWeight?: number;
		bgLineWeight?: number;
		families?: FamilyFlags;
		bgMode?: 'flat' | 'topo';
		contourCount?: number;
		noiseScale?: number;
		noiseOctaves?: number;
		fontFamily?: string;
		fontWeight?: string | number;
		fontStyle?: string;
		tracking?: number;
		imageFit?: 'cover' | 'contain' | 'stretch';
		seed?: number;
		morphStyle?: MorphStyle;
		morphJitter?: number;
		maskReveal?: number;
		maskRevealStyle?: MorphStyle;
		maskRevealJitter?: number;
		animate?: boolean;
		seeds?: number[];
		transitionMs?: number;
		holdMs?: number;
		easing?: boolean;
		fps?: number;
		dprCap?: number;
		intensity?: Intensity;
		opacity?: number;
		pauseWhenHidden?: boolean;
		class?: string;
		ariaHidden?: boolean;
	} = $props();

	let canvas: HTMLCanvasElement;
	let engine: MultitruchetEngine | undefined;
	let visible = $state(true);

	// Resolve the mask stack: explicit `layers` wins, else build one from the
	// `text` / `image` shorthand, else none (pure background field).
	const resolvedLayers = $derived.by<Layer[] | undefined>(() => {
		if (layers) return layers;
		if (text != null) return [{ type: 'text', text, color }];
		if (image != null) return [{ type: 'image', image, color, colorize }];
		return undefined;
	});

	// Only forward props the caller actually set, so preset/engine defaults
	// fill the rest instead of being clobbered with `undefined`.
	const options = $derived.by<EngineOptions>(() => {
		const o: EngineOptions = { preset, bg, seed, animate };
		const put = <K extends keyof EngineOptions>(k: K, v: EngineOptions[K] | undefined) => {
			if (v !== undefined) o[k] = v;
		};
		put('bgFg', fg);
		put('layers', resolvedLayers);
		put('rootGrid', rootGrid);
		put('maxDepth', maxDepth);
		put('falloff', falloff);
		put('threshold', threshold);
		put('textLineWeight', textLineWeight);
		put('bgLineWeight', bgLineWeight);
		put('families', families);
		put('bgMode', bgMode);
		put('contourCount', contourCount);
		put('noiseScale', noiseScale);
		put('noiseOctaves', noiseOctaves);
		put('fontFamily', fontFamily);
		put('fontWeight', fontWeight);
		put('fontStyle', fontStyle);
		put('tracking', tracking);
		put('imageFit', imageFit);
		put('morphStyle', morphStyle);
		put('morphJitter', morphJitter);
		put('maskReveal', maskReveal);
		put('maskRevealStyle', maskRevealStyle);
		put('maskRevealJitter', maskRevealJitter);
		put('seeds', seeds);
		put('transitionMs', transitionMs);
		put('holdMs', holdMs);
		put('easing', easing);
		put('fps', fps);
		put('dprCap', dprCap);
		return o;
	});

	onMount(() => {
		engine = new MultitruchetEngine(canvas, options);
		if (animate && visible) engine.start();

		// A text mask auto-fits its font size via canvas measureText. If a web font
		// (e.g. --font-display) is still loading at first render, it measures against
		// the fallback face → wrong fit + placement (the squished, mis-laid word that
		// showed up in the PDF export). Re-render once fonts are ready so the mask is
		// rebuilt against the real glyphs. Cheap no-op when there's no text layer.
		if (typeof document !== "undefined" && document.fonts?.ready) {
			document.fonts.ready.then(() => engine?.resize());
		}

		const ro = new ResizeObserver(() => engine?.resize());
		ro.observe(canvas);

		let io: IntersectionObserver | undefined;
		if (pauseWhenHidden && typeof IntersectionObserver !== 'undefined') {
			io = new IntersectionObserver(
				([entry]) => {
					visible = entry.isIntersecting;
				},
				{ rootMargin: '64px' }
			);
			io.observe(canvas);
		}

		const onVisibility = () => {
			if (document.hidden) engine?.stop();
			else if (animate && visible) engine?.start();
		};
		document.addEventListener('visibilitychange', onVisibility);

		return () => {
			ro.disconnect();
			io?.disconnect();
			document.removeEventListener('visibilitychange', onVisibility);
			engine?.destroy();
			engine = undefined;
		};
	});

	// Push option changes into the engine (re-renders / restarts as needed).
	$effect(() => {
		engine?.setOptions(options);
	});

	// Start/stop the morph loop with visibility.
	$effect(() => {
		if (!engine) return;
		if (animate && visible && !document.hidden) engine.start();
		else engine.stop();
	});

	const styleOpacity = $derived(intensity ? undefined : opacity);
</script>

<canvas
	bind:this={canvas}
	class="multitruchet {klass}"
	data-intensity={intensity}
	style:opacity={styleOpacity}
	aria-hidden={ariaHidden}
></canvas>

<style>
	.multitruchet {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		z-index: 0;
		pointer-events: none;
	}
	/* PatternBg parity: map intensity to the shared opacity tokens. */
	.multitruchet[data-intensity='hero'] {
		opacity: var(--pattern-opacity-hero);
	}
	.multitruchet[data-intensity='section'] {
		opacity: var(--pattern-opacity-section);
	}
	.multitruchet[data-intensity='subtle'] {
		opacity: var(--pattern-opacity-subtle);
	}
</style>
