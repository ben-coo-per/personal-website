<script lang="ts">
	import type { StatusPost } from '$lib/types';
	import { formatStatusTime } from '$lib/utils/format';
	import DitherMedia from './DitherMedia.svelte';

	interface Props {
		post: StatusPost;
		/** Newest post on the feed: larger type and a "latest" marker. */
		featured?: boolean;
		/** Render as a standalone permalink page entry (no self-link on the timestamp). */
		standalone?: boolean;
	}

	let { post, featured = false, standalone = false }: Props = $props();

	const MAX_TILES = 4;
	const permalink = $derived(`https://www.bencooper.xyz/status/${post.slug}`);
	const tiles = $derived(post.images.slice(0, MAX_TILES));
	const overflow = $derived(post.images.length - tiles.length);
	const count = $derived(Math.min(post.images.length, MAX_TILES));

	// A lone image keeps (roughly) its own shape, clamped so portraits don't
	// tower and panoramas don't become slivers.
	const soloRatio = $derived.by(() => {
		const img = post.images[0];
		if (!img?.width || !img?.height) return 4 / 3;
		return Math.min(16 / 9, Math.max(4 / 5, img.width / img.height));
	});

	const syndication = $derived(
		(
			[
				['threads', post.syndication.threads],
				['bluesky', post.syndication.bluesky]
			] as [string, string | undefined][]
		).filter((s): s is [string, string] => !!s[1])
	);
</script>

<article class="status h-entry" class:featured class:standalone>
	<div class="meta">
		{#if featured}
			<span class="latest"><span class="pulse"></span>latest</span>
		{/if}
		{#if standalone}
			<time class="dt-published" datetime={post.publishedAt.toISOString()}
				>{formatStatusTime(post.publishedAt)}</time
			>
			<a class="u-url visually-hidden" href={permalink}>permalink</a>
		{:else}
			<a class="u-url stamp" href="/status/{post.slug}">
				<time class="dt-published" datetime={post.publishedAt.toISOString()}
					>{formatStatusTime(post.publishedAt)}</time
				>
			</a>
		{/if}
		{#if post.place}
			<span class="place p-location">@ {post.place}</span>
		{/if}
	</div>

	{#if post.text}
		<p class="text e-content p-name">{@html post.html}</p>
	{/if}

	{#if tiles.length > 0}
		<div
			class="grid"
			data-count={count}
			style={count === 1 ? `aspect-ratio: ${soloRatio}` : undefined}
		>
			{#each tiles as img, i}
				<a
					class="tile u-photo"
					href={img.url}
					target="_blank"
					rel="noreferrer"
					aria-label={img.alt ? `Open image: ${img.alt}` : 'Open image'}
				>
					<DitherMedia src={img.url} alt={img.alt} fill />
					{#if overflow > 0 && i === tiles.length - 1}
						<span class="more">+{overflow}</span>
					{/if}
				</a>
			{/each}
		</div>
	{/if}

	{#if syndication.length > 0}
		<div class="synd">
			{#each syndication as [name, url]}
				<a class="u-syndication" href={url} target="_blank" rel="noreferrer"
					>also on {name} <span class="arr">↗</span></a
				>
			{/each}
		</div>
	{/if}
</article>

<style>
	.status {
		padding: 22px 0 24px;
		border-bottom: 1px dashed var(--rule);
		min-width: 0;
	}

	.status.standalone {
		border-bottom: none;
		padding-top: 0;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 14px;
		font-family: var(--font-mono);
		font-size: 11.5px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 10px;
	}

	.stamp {
		transition: color 0.15s;
	}

	.stamp:hover {
		color: var(--amber);
	}

	.place {
		color: var(--ink-2);
		text-transform: lowercase;
		letter-spacing: 0.02em;
	}

	.latest {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		color: var(--amber);
	}

	.pulse {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--amber);
		box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.6);
		animation: pulse 2.4s ease-out infinite;
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.55);
		}
		70%,
		100% {
			box-shadow: 0 0 0 8px rgba(251, 191, 36, 0);
		}
	}

	.text {
		margin: 0;
		font-size: 17px;
		line-height: 1.5;
		color: var(--ink);
		max-width: 62ch;
		overflow-wrap: anywhere;
	}

	.featured .text,
	.standalone .text {
		font-family: var(--font-display);
		font-size: clamp(24px, 2.6vw, 34px);
		line-height: 1.15;
		letter-spacing: -0.015em;
		max-width: 30ch;
	}

	.text :global(a) {
		color: var(--amber);
		border-bottom: 1px solid rgba(251, 191, 36, 0.3);
	}

	.text :global(a):hover {
		border-color: var(--amber);
	}

	/* ===== image grid ===== */

	.grid {
		display: grid;
		gap: 6px;
		margin-top: 14px;
		border-radius: var(--radius);
		overflow: hidden;
		max-width: 720px;
	}

	.grid[data-count='1'] {
		grid-template-columns: 1fr;
		max-height: 560px;
	}

	.grid[data-count='2'] {
		grid-template-columns: 1fr 1fr;
		aspect-ratio: 2 / 1;
	}

	.grid[data-count='3'] {
		grid-template-columns: 2fr 1fr;
		grid-template-rows: 1fr 1fr;
		aspect-ratio: 3 / 2;
	}

	.grid[data-count='3'] .tile:first-child {
		grid-row: span 2;
	}

	.grid[data-count='4'] {
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		aspect-ratio: 1 / 1;
		max-width: 560px;
	}

	.tile {
		position: relative;
		display: block;
		min-height: 0;
		min-width: 0;
		height: 100%;
	}

	.tile :global(.dither-media__img) {
		transition:
			opacity 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 180ms,
			transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.tile:hover :global(.dither-media__img) {
		transform: scale(1.025);
	}

	.more {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		background: rgba(10, 10, 11, 0.6);
		font-family: var(--font-mono);
		font-size: 20px;
		color: var(--ink);
		z-index: 2;
	}

	/* ===== syndication ===== */

	.synd {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 16px;
		margin-top: 12px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--ink-3);
		text-transform: lowercase;
	}

	.synd a {
		transition: color 0.15s;
	}

	.synd a:hover,
	.synd a:hover .arr {
		color: var(--amber);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	@media (max-width: 600px) {
		.text {
			font-size: 16px;
		}
		.grid[data-count='2'] {
			aspect-ratio: 4 / 3;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pulse {
			animation: none;
		}
	}
</style>
