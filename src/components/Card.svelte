<script lang="ts">
	import { urlFor } from '$lib/utils/image';
	import type { Project } from '$lib/types';

	interface Props {
		project: Project;
	}

	let { project }: Props = $props();

	const thumbUrl = $derived(
		project.previewImage ? urlFor(project.previewImage, project.slug).url() : null
	);

	const year = $derived(project.date ? project.date.getFullYear() : '');

	const status = $derived(project.isRestricted ? 'confidential' : '');

	function navigate() {
		window.location.href = `/projects/${project.slug}`;
	}
</script>

<a
	class="card"
	href="/projects/{project.slug}"
	onclick={(e) => {
		e.preventDefault();
		navigate();
	}}
>
	<div class="thumb">
		{#if thumbUrl}
			<img src={thumbUrl} alt={project.title ?? ''} loading="lazy" />
		{:else}
			<div class="thumb-placeholder"></div>
		{/if}
		<span class="corner">{year}</span>
	</div>
	<div class="body">
		<div class="meta">
			<span>{status}</span>
			<span class="year-right">{year}</span>
		</div>
		<h3>{project.title ?? 'Untitled'} <span class="arrow">↗</span></h3>
		{#if project.subtitle || project.mainDescription}
			<p>{project.subtitle ?? project.mainDescription}</p>
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
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: opacity 0.3s;
		opacity: 0.7;
	}

	.card:hover .thumb img {
		opacity: 1;
	}

	.thumb-placeholder {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(circle at 60% 55%, rgba(251, 191, 36, 0.18) 0%, transparent 60%),
			repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.03) 0 1px, transparent 1px 9px),
			repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0 1px, transparent 1px 9px),
			var(--bg-3);
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
</style>
