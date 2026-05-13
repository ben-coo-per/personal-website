<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		taglines: string[];
		holdMs?: number;
		transitionMs?: number;
	}

	let { taglines, holdMs = 5200, transitionMs = 480 }: Props = $props();

	// Dot glyphs matched to the site's dither motif — same weight as the text,
	// so the dissolve registers as texture, not noise.
	const GLYPHS = '·∙░▒';

	// Pad every displayed string to the longest tagline so width never shifts.
	const maxLen = Math.max(1, ...taglines.map((t) => t.length));
	const pad = (s: string) => (s + ' '.repeat(maxLen)).slice(0, maxLen);

	let display = $state(pad(taglines[0] ?? ''));

	function randGlyph() {
		return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
	}

	// Bit-reversal permutation: gives every char index a threshold in [0,1) that
	// is evenly scattered across the timeline — the same scheme ordered-dither
	// uses to break up bands. Index 0 fires first, then N/2, then N/4, 3N/4 …
	// so the eye sees a structured dissolve, never a left-to-right wipe.
	function makeThresholds(len: number): number[] {
		const bits = Math.max(1, Math.ceil(Math.log2(Math.max(2, len))));
		const N = 1 << bits;
		const out: number[] = new Array(len);
		for (let i = 0; i < len; i++) {
			let r = 0;
			for (let b = 0; b < bits; b++) r = (r << 1) | ((i >> b) & 1);
			out[i] = r / N;
		}
		return out;
	}

	function animateTo(from: string, target: string): Promise<void> {
		return new Promise((resolve) => {
			const fromP = pad(from);
			const toP = pad(target);
			const len = maxLen;
			const start = performance.now();
			const thresholds = makeThresholds(len);
			const scrambleWindow = 0.14; // fraction of timeline each char spends as a dot

			function frame(now: number) {
				const t = Math.min(1, (now - start) / transitionMs);
				let next = '';
				for (let i = 0; i < len; i++) {
					const oldChar = fromP[i];
					const newChar = toP[i];
					// Compress thresholds into [0, 1 - scrambleWindow] so the last char
					// still has time to finish before t reaches 1.
					const charStart = thresholds[i] * (1 - scrambleWindow);
					const charEnd = charStart + scrambleWindow;
					if (t < charStart) next += oldChar;
					else if (t >= charEnd) next += newChar;
					else if (oldChar === ' ' && newChar === ' ') next += ' ';
					else next += randGlyph();
				}
				display = next;
				if (t < 1) requestAnimationFrame(frame);
				else {
					display = toP;
					resolve();
				}
			}
			requestAnimationFrame(frame);
		});
	}

	onMount(() => {
		if (taglines.length <= 1) return;
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout>;
		let index = 0;

		async function tick() {
			if (cancelled) return;
			const from = display;
			index = (index + 1) % taglines.length;
			await animateTo(from, taglines[index]);
			if (cancelled) return;
			timer = setTimeout(tick, holdMs);
		}

		timer = setTimeout(tick, holdMs);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	});
</script>

<h2 class="cycler">{display}</h2>

<style>
	.cycler {
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--ink-3);
		margin: 12px 0 0;
		font-weight: 400;
		white-space: pre;
	}
</style>
