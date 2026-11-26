<script lang="ts">
	/**
	 * LivePattern — a real-time PIGEON pattern, generated from THIS device.
	 *
	 * The lightest-weight distillation of the pattern-studio (PIGEON/pattern-
	 * studio): it strips the map, the controls, and the export pipeline and keeps
	 * only the live loop — ask the browser for the device's location, stamp the
	 * current time, encode the payload, and paint the truchet texture. The same
	 * wasm encoder the studio uses (`encode_payload` → `payload_raster`) so the
	 * pattern on screen is the *real* thing, not a decorative stand-in.
	 *
	 *   <LivePattern />                       <!-- locate + render, that's it -->
	 *   <LivePattern size={700} showReadout /> <!-- bigger, with the live payload -->
	 *
	 * Geolocation needs a secure context (HTTPS / localhost) and the viewer's
	 * permission. While we wait — or if it's denied — we fall back to a default
	 * coordinate so there is always a pattern on screen, and `status` says which.
	 *
	 * The wasm (~380 KB) loads lazily in onMount, so it is only paid for once this
	 * component is actually mounted (e.g. when the Pattern pillar is selected).
	 */
	import { onMount, type Snippet } from "svelte";
	import wasmUrl from "./wasm/truchet_wasm_bg.wasm?url";

	// Loaded on mount so neither the server render nor the first paint pays for it.
	type Wasm = typeof import("./wasm/truchet_wasm.js");
	let wasm: Wasm | undefined;

	/** Live snapshot of what's currently encoded — emitted on every re-render. */
	export interface PatternState {
		lat: number;
		lon: number;
		quanta: number;
		deviceId: number;
		counter: number;
		tileCount: number;
		status: Status;
	}

	type Status = "init" | "locating" | "live" | "default" | "denied";

	let {
		/** Internal raster resolution in px. Multiples of 7 keep tile edges crisp. */
		size = 392,
		/** Demo device identity (20-bit). */
		deviceId = 4375,
		/** Per-device emission counter (20-bit). */
		counter = 1,
		/** Tile colour cycle string (see the studio). */
		cycle = "WK,KW",
		/** Show the coordinate / quanta readout strip under the canvas. */
		showReadout = false,
		/** Extra class on the root. */
		class: klass = "",
		/** Fires whenever the pattern re-encodes, with the live payload values. */
		onstate,
		/** Drawn on top of the pattern (e.g. a call to action). */
		overlay,
	}: {
		size?: number;
		deviceId?: number;
		counter?: number;
		cycle?: string;
		showReadout?: boolean;
		class?: string;
		onstate?: (s: PatternState) => void;
		overlay?: Snippet;
	} = $props();

	// Project epoch: Jan 1 2026 00:00 UTC (matches the Rust constant) and the
	// 10-minute quantum the timestamp is bucketed into.
	const EPOCH_MS = Date.UTC(2026, 0, 1, 0, 0, 0);
	const TEN_MIN_MS = 10 * 60 * 1000;
	const MAX_FIELD = (1 << 20) - 1;

	// London as the fallback location until (or unless) geolocation answers.
	const FALLBACK = { lat: 51.5074, lon: -0.1278 };

	let ready = $state(false);
	let status = $state<Status>("init");
	let lat = $state(FALLBACK.lat);
	let lon = $state(FALLBACK.lon);
	let nowMs = $state(EPOCH_MS); // replaced with the real clock in onMount
	let tileCount = $state(payloadTileFallback());

	let canvasEl: HTMLCanvasElement | null = $state(null);

	function payloadTileFallback() {
		return 52; // until wasm reports the real count
	}

	function timeToQuanta(ms: number) {
		const delta = ms - EPOCH_MS;
		return delta < 0 ? 0 : Math.floor(delta / TEN_MIN_MS);
	}
	function latToInt(deg: number) {
		return Math.max(0, Math.min(1_800_000, Math.floor((deg + 90) * 1e4)));
	}
	function lonToInt(deg: number) {
		return Math.max(0, Math.min(3_600_000, Math.floor((deg + 180) * 1e4)));
	}

	const quanta = $derived(timeToQuanta(nowMs));

	// The encoded time is a 10-minute block counted from the epoch; spell out which
	// block in the viewer's own clock. Empty until mounted, so the server render
	// doesn't show the epoch.
	const timeWindow = $derived.by(() => {
		if (nowMs === EPOCH_MS) return "";
		const start = new Date(EPOCH_MS + quanta * TEN_MIN_MS);
		const end = new Date(start.getTime() + TEN_MIN_MS);
		const hm = (d: Date) =>
			d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
		const day = start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
		return `${day}, ${hm(start)}–${hm(end)}`;
	});

	onMount(() => {
		let interval: ReturnType<typeof setInterval> | undefined;
		let cancelled = false;

		nowMs = Date.now();

		(async () => {
			const mod = await import("./wasm/truchet_wasm.js");
			await mod.default({ module_or_path: wasmUrl });
			if (cancelled) return;
			wasm = mod;
			tileCount = mod.payload_tile_count();
			ready = true;
		})();

		// On the website the location is opt-in (see locate()): a portfolio page
		// shouldn't ask for it on load. Until then the pattern encodes London.
		status = "default";

		// Keep the clock fresh so the pattern advances when a 10-min quantum ticks.
		interval = setInterval(() => {
			nowMs = Date.now();
		}, 30_000);

		return () => {
			cancelled = true;
			if (interval) clearInterval(interval);
			if (scrambling) clearInterval(scrambling);
		};
	});

	/**
	 * Ask for the viewer's real location. While waiting, the pattern scrambles
	 * through random coordinates (each frame a real encoding) for at least
	 * SCRAMBLE_MS, then settles on the answer, or back on London if refused.
	 */
	const SCRAMBLE_MS = 1400;
	let scrambling: ReturnType<typeof setInterval> | undefined;
	export function locate() {
		if (status === "locating") return;
		const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
		const started = performance.now();
		status = "locating";
		if (!reduced) {
			scrambling = setInterval(() => {
				lat = round4(Math.random() * 140 - 70);
				lon = round4(Math.random() * 360 - 180);
			}, 70);
		}
		const settle = (next: { lat: number; lon: number } | null) => {
			const wait = reduced ? 0 : Math.max(0, SCRAMBLE_MS - (performance.now() - started));
			setTimeout(() => {
				clearInterval(scrambling);
				scrambling = undefined;
				lat = next?.lat ?? FALLBACK.lat;
				lon = next?.lon ?? FALLBACK.lon;
				status = next ? "live" : "denied";
			}, wait);
		};
		if (typeof navigator === "undefined" || !navigator.geolocation) return settle(null);
		navigator.geolocation.getCurrentPosition(
			(pos) => settle({ lat: round4(pos.coords.latitude), lon: round4(pos.coords.longitude) }),
			() => settle(null),
			{ enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
		);
	}

	function round4(v: number) {
		return Math.round(v * 1e4) / 1e4;
	}

	// Re-encode + repaint whenever any input changes.
	$effect(() => {
		if (!ready || !canvasEl || !wasm) return;
		const symbols = new Uint8Array(
			wasm.encode_payload(
				deviceId & MAX_FIELD,
				counter & MAX_FIELD,
				quanta >>> 0,
				latToInt(lat) >>> 0,
				lonToInt(lon) >>> 0,
			),
		);
		const rgba = wasm.payload_raster(symbols, cycle, size, false);
		canvasEl.width = size;
		canvasEl.height = size;
		canvasEl
			.getContext("2d")!
			.putImageData(
				new ImageData(new Uint8ClampedArray(rgba), size, size),
				0,
				0,
			);

		onstate?.({ lat, lon, quanta, deviceId, counter, tileCount, status });
	});

	const statusLabel = $derived(
		status === "live"
			? "LIVE · YOUR LOCATION"
			: status === "locating"
				? "ENCODING…"
				: status === "default" || status === "denied"
					? "LONDON"
					: "STARTING…",
	);
</script>

<div class="lp {klass}" data-status={status}>
	<div class="lp__frame">
		<canvas bind:this={canvasEl} class="lp__canvas"></canvas>
		{#if !ready}
			<div class="lp__loading"><span class="t-label">ENCODING…</span></div>
		{/if}
		<span class="lp__status">{statusLabel}</span>
		{#if overlay && ready}{@render overlay()}{/if}
	</div>

	{#if showReadout}
		<dl class="lp__readout">
			<div>
				<dt>LAT</dt>
				<dd>{lat.toFixed(4)}°</dd>
			</div>
			<div>
				<dt>LON</dt>
				<dd>{lon.toFixed(4)}°</dd>
			</div>
			<div class="lp__time">
				<dt>TIME</dt>
				<dd>{quanta.toLocaleString('en-GB')}</dd>
				{#if timeWindow}<dd class="lp__note">{timeWindow} · a 10-minute window</dd>{/if}
			</div>
		</dl>
	{/if}
</div>

<style>
	.lp {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
		height: 100%;
	}

	/* The pattern is black-on-white truchet — it needs a white field to read. */
	.lp__frame {
		position: relative;
		flex: 1;
		min-height: 0;
		aspect-ratio: 1 / 1;
		background: var(--color-white);
		border: var(--border-default);
		overflow: hidden;
	}
	.lp__canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		/* Crisp tile edges — never smooth the integer-scaled raster. */
		image-rendering: pixelated;
		image-rendering: crisp-edges;
	}

	.lp__loading {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-white);
		color: var(--color-gray-mid);
	}

	.lp__status {
		position: absolute;
		left: var(--space-2);
		top: var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--type-label);
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
		color: var(--color-bg);
		background: rgba(240, 240, 238, 0.82);
		padding: 2px var(--space-2);
	}
	.lp[data-status="live"] .lp__status {
		color: var(--color-white);
		background: var(--color-accent);
	}

	.lp__readout {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-3) var(--space-5);
		margin: 0;
	}
	.lp__readout div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.lp__readout dt {
		font-family: var(--font-mono);
		font-size: var(--type-label);
		letter-spacing: var(--tracking-label);
		color: var(--color-text-secondary);
	}
	.lp__readout dd {
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--type-data);
		color: var(--color-text-primary);
	}
	.lp__readout .lp__time {
		grid-column: 1 / -1;
	}
	.lp__readout .lp__note {
		font-size: var(--type-label);
		color: var(--color-text-secondary);
	}
</style>
