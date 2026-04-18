<script lang="ts">
	import Card from '../../components/Card.svelte';
	import { cmdkOpen } from '$lib/stores/ui';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const restrictedAccess = $derived(data.restrictedAccess ?? false);
	const hasRestrictedProjects = $derived(data.hasRestrictedProjects ?? false);
	// const aboutParagraphs = $derived(
	// 	(data.about?.body ?? []).map((b: { text: string }) => b.text).filter(Boolean)
	// );
	const projectCount = $derived(data.projects.length);
</script>

<div class="site">
	<header class="hero">
		<div>
			<div class="eyebrow">2026</div>
			<h1>Ben Cooper</h1>
			<h2>engineer, designer, developer</h2>
		</div>
		<div></div>
	</header>

	<!-- CURATED WORK -->
	<div class="sec-head">
		<span class="label">/ curated work</span>
		<span class="count">{String(projectCount).padStart(2, '0')} projects</span>
	</div>

	<section class="projects-grid" id="curated">
		{#each data.projects as project}
			<Card {project} />
		{/each}

		{#if hasRestrictedProjects && !restrictedAccess}
			<div
				class="locked-card"
				onclick={() => cmdkOpen.set(true)}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter') cmdkOpen.set(true);
				}}
			>
				<div class="locked-thumb"></div>
				<div class="locked-body">
					<div class="locked-meta">
						<span class="dot"></span>
						<span>confidential</span>
						<span class="yr">⌘K</span>
					</div>
					<h3>confidential work <span class="arrow">↗</span></h3>
					<p>Client &amp; NDA work lives here. Open the palette &amp; enter a passcode.</p>
				</div>
			</div>
		{/if}
	</section>
</div>

<style>
	/* ===== HERO ===== */
	.hero {
		display: grid;
		grid-template-columns: 1.15fr 1fr;
		gap: 40px;
		align-items: end;
		padding: 36px 6px 56px;
	}

	.eyebrow {
		font-family: var(--font-mono);
		font-size: 11.5px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 20px;
	}

	h1 {
		font-family: var(--font-display);
		font-size: clamp(40px, 6vw, 86px);
		line-height: 0.95;
		letter-spacing: -0.03em;
		margin: 0;
		font-weight: 400;
		color: var(--amber);
	}

	h2 {
		font-size: 15px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--ink-3);
		margin: 12px 0 0;
	}

	/* ===== PROJECT GRID ===== */
	.projects-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
	}

	/* ===== LOCKED CARD ===== */
	.locked-card {
		display: block;
		border: 1px solid var(--rule);
		background: rgba(17, 17, 20, 0.5);
		border-radius: var(--radius);
		overflow: hidden;
		backdrop-filter: blur(4px);
		cursor: pointer;
		transition:
			border-color 0.2s,
			transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.locked-card:hover {
		border-color: var(--rule-2);
		transform: translateY(-2px);
	}

	.locked-thumb {
		aspect-ratio: 4 / 3;
		background:
			repeating-linear-gradient(45deg, rgba(251, 191, 36, 0.07) 0 10px, transparent 10px 20px),
			var(--bg-3);
	}

	.locked-body {
		padding: 16px 18px 18px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.locked-meta {
		display: flex;
		gap: 10px;
		align-items: center;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.locked-meta .dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--ink-3);
		flex-shrink: 0;
	}
	.locked-meta .yr {
		margin-left: auto;
	}

	.locked-card h3 {
		font-size: 20px;
		line-height: 1.1;
		letter-spacing: -0.02em;
		margin: 2px 0 0;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.locked-card .arrow {
		font-family: var(--font-mono);
		color: var(--ink-3);
		font-size: 14px;
		transition:
			transform 0.25s,
			color 0.25s;
	}
	.locked-card:hover .arrow {
		transform: translate(3px, -3px);
		color: var(--amber);
	}
	.locked-card p {
		margin: 4px 0 0;
		font-size: 14px;
		line-height: 1.45;
		color: var(--ink-2);
		max-width: 40ch;
	}

	/* ===== RESPONSIVE ===== */
	@media (max-width: 960px) {
		.hero {
			grid-template-columns: 1fr;
			gap: 28px;
			padding: 20px 0 36px;
		}
		.projects-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 600px) {
		.projects-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
