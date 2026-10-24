<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A grid of Figures (or bare <img>/<video>). Cells crop to 4:3 by default, 1:1 when
	 * `dense`, or keep their own shape with `natural`. Without `cols` the grid fills with
	 * as many ~240px (dense: ~150px) columns as fit, so it adapts to the storehouse panel.
	 * `aspect` overrides the cell crop, e.g. '3/4' for a row of portrait shots.
	 */
	interface Props {
		cols?: 2 | 3 | 4;
		dense?: boolean;
		natural?: boolean;
		aspect?: '4/3' | '3/2' | '16/9' | '1/1' | '4/5' | '3/4';
		class?: string;
		children: Snippet;
	}

	let {
		cols,
		dense = false,
		natural = false,
		aspect,
		class: className = '',
		children
	}: Props = $props();
</script>

<div
	class="media-grid {dense ? 'dense' : ''} {natural ? 'natural' : ''} {className}"
	data-cols={cols}
	style={aspect ? `--cell-aspect: ${aspect.replace('/', ' / ')}` : undefined}
>
	{@render children()}
</div>
