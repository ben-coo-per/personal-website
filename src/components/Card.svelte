<script lang="ts">
	import { urlFor } from '$lib/utils/image';
	import type { Project } from '$lib/types';
	import DitherMedia from './DitherMedia.svelte';

	interface Props {
		project: Project;
	}

	let { project }: Props = $props();

	const thumbUrl = $derived(
		project.previewImage ? urlFor(project.previewImage, project.slug).url() : null
	);

	const year = $derived(project.date ? project.date.getFullYear() : '');

	const status = $derived(
		project.wip ? 'work in progress' : project.isRestricted ? 'confidential' : ''
	);

	function navigate() {
		window.location.href = `/projects/${project.slug}`;
	}
</script>

<a
	class="card"
	class:wip={project.wip}
	href="/projects/{project.slug}"
	onclick={(e) => {
		e.preventDefault();
		navigate();
	}}
>
	<div class="thumb">
		<DitherMedia src={thumbUrl} alt={project.title ?? ''} aspect="4/3" fill loading="lazy">
			<span class="corner">{year}</span>
		</DitherMedia>
	</div>
	<div class="body">
		<div class="meta">
			{#if project.wip}
				<span class="dot wip-dot"></span>
			{/if}
			<span class="status">{status}</span>
			<span class="year-right">{year}</span>
		</div>
		<h3>{project.title ?? 'Untitled'} <span class="arrow">↗</span></h3>
		{#if project.subtitle || project.mainDescription}
			<p>{project.subtitle ?? project.mainDescription}</p>
		{:else if project.wip}
			<p>Still in the works — full write-up coming soon.</p>
		{/if}
	</div>
</a>

<style>
	.card {
		display: block;
		border: 1px solid var(--rule);
		background: rgba(17, 17, 20, 0.5);
		border-radius: var(--radius);
		overflow: hidden;
		backdrop-filter: blur(4px);
		transition:
			border-color 0.2s,
			transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
			background 0.2s;
		text-decoration: none;
		color: inherit;
	}

	.card:hover {
		border-color: var(--rule-2);
		transform: translateY(-2px);
		background: rgba(23, 23, 28, 0.7);
	}

	.thumb {
		position: relative;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		background: var(--bg-3);
		border-bottom: 1px solid var(--rule);
	}

	.thumb::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, transparent 60%, rgba(0, 0, 0, 0.3) 100%);
		pointer-events: none;
		z-index: 1;
	}

	.card :global(.thumb .dither-media[data-loaded='true'] .dither-media__img) {
		opacity: 0.78;
		transition:
			opacity 500ms cubic-bezier(0.2, 0.8, 0.2, 1) 180ms;
	}

	.card:hover :global(.thumb .dither-media[data-loaded='true'] .dither-media__img) {
		opacity: 1;
		transition: opacity 0.3s ease-out;
	}

	.corner {
		position: absolute;
		top: 10px;
		right: 10px;
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: var(--ink);
		background: rgba(0, 0, 0, 0.55);
		padding: 3px 7px;
		border-radius: 4px;
		backdrop-filter: blur(6px);
		letter-spacing: 0.02em;
		z-index: 2;
	}

	.body {
		padding: 16px 18px 18px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.meta {
		display: flex;
		gap: 10px;
		align-items: center;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		display: inline-block;
		background: var(--amber);
		flex-shrink: 0;
	}

	.year-right {
		margin-left: auto;
	}

	h3 {
		font-size: 20px;
		line-height: 1.1;
		letter-spacing: -0.02em;
		margin: 2px 0 0;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.arrow {
		font-family: var(--font-mono);
		color: var(--ink-3);
		font-size: 14px;
		transition:
			transform 0.25s,
			color 0.25s;
	}

	.card:hover .arrow {
		transform: translate(3px, -3px);
		color: var(--amber);
	}

	p {
		margin: 4px 0 0;
		font-size: 14px;
		line-height: 1.45;
		color: var(--ink-2);
		max-width: 40ch;
	}

	/* ===== WORK IN PROGRESS ===== */
	.card.wip {
		border: 1px dashed rgba(251, 191, 36, 0.4);
		background: rgba(251, 191, 36, 0.03);
	}

	.card.wip:hover {
		border-color: var(--amber);
	}

	.card.wip .thumb {
		background:
			repeating-linear-gradient(45deg, rgba(251, 191, 36, 0.07) 0 10px, transparent 10px 20px),
			var(--bg-3);
	}

	.card.wip .status {
		color: var(--amber);
	}

	.wip-dot {
		animation: wip-pulse 2s ease-in-out infinite;
	}

	@keyframes wip-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}
</style>
