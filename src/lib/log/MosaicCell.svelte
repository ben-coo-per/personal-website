<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * One cell of a Mosaic. `col` is a CSS grid-column value on the 12-column grid
	 * ('1 / span 7', '8 / span 4'); `shift` drops the cell down by that many pixels;
	 * `align` sets its vertical alignment in the row. `wide` keeps it full width when the
	 * mosaic falls back to two columns.
	 */
	interface Props {
		col: string;
		shift?: number;
		align?: 'start' | 'center' | 'end';
		wide?: boolean;
		children: Snippet;
	}

	let { col, shift = 0, align = 'start', wide = false, children }: Props = $props();
</script>

<div
	class="mosaic__cell {wide ? 'wide' : ''}"
	style="--col: {col}; --shift: {shift}px; --align: {align}"
>
	{@render children()}
</div>
