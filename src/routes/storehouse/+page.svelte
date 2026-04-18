<script lang="ts">
	import type { PageData } from './$types';
	import type { ProjectMetadata } from '$lib/types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let selected: ProjectMetadata | null = $state(null);
	let panelHtml = $state('');
	let panelLoading = $state(false);

	const projectCount = $derived(data.projects.length);

	async function openProject(project: ProjectMetadata) {
		if (selected?.slug === project.slug) {
			selected = null;
			return;
		}
		selected = project;
		panelHtml = '';
		panelLoading = true;
		try {
			const res = await fetch(`/api/project-content/${project.slug}`);
			const body = await res.json();
			panelHtml = body.html;
		} finally {
			panelLoading = false;
		}
	}

	function closePanel() {
		selected = null;
	}

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
	}
</script>

<svelte:head>
	<title>Storehouse – Ben Cooper</title>
	<meta
		name="description"
		content="A dense archive of every project — big, small, and half-finished."
	/>
</svelte:head>

<div class="site">
	<div class="sec-head">
		<span class="label">/ storehouse</span>
		<span class="count">{String(projectCount).padStart(2, '0')} projects</span>
	</div>

	<div class="workspace" class:has-panel={!!selected}>
		<!-- panel must precede the list so the float wraps correctly -->
		<div class="panel-col" aria-hidden={!selected}>
			<div class="panel-inner">
				{#if selected}
					<div class="panel-head">
						<div class="panel-titles">
							<h2>{selected.title}</h2>
							{#if selected.subtitle}
								<p class="panel-sub">{selected.subtitle}</p>
							{/if}
						</div>
						<button class="close-btn" onclick={closePanel} aria-label="Close panel">×</button>
					</div>

					{#if selected.githubLink || selected.instagramLink || selected.onshapeLink || selected.downloadableFile}
						<div class="panel-links">
							{#if selected.githubLink}
								<a href={selected.githubLink} target="_blank" rel="noopener noreferrer">github ↗</a
								>
							{/if}
							{#if selected.instagramLink}
								<a href={selected.instagramLink} target="_blank" rel="noopener noreferrer"
									>instagram ↗</a
								>
							{/if}
							{#if selected.onshapeLink}
								<a href={selected.onshapeLink} target="_blank" rel="noopener noreferrer"
									>onshape ↗</a
								>
							{/if}
							{#if selected.downloadableFile}
								<a href="/cms-assets/projects/{selected.slug}/{selected.downloadableFile}" download>
									download ↓
								</a>
							{/if}
						</div>
					{/if}

					<div class="panel-body">
						{#if panelLoading}
							<p class="loading">loading…</p>
						{:else if panelHtml}
							<div class="article-body">{@html panelHtml}</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<ul class="list">
			{#each data.projects as project}
				<li class="list-item">
					<button
						class="row"
						class:active={selected?.slug === project.slug}
						onclick={() => openProject(project)}
						type="button"
					>
						<span class="cell-date">{formatDate(project.date)}</span>
						<span class="cell-title">{project.title ?? ''}</span>
						<span class="cell-sub">{project.subtitle ?? ''}</span>
						<span class="cell-arrow">↗</span>
					</button>
				</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	/* ===== LAYOUT =====
	   Float-based: panel floats right, list items establish a block formatting
	   context (overflow: hidden on li) so they sit beside the float and
	   automatically return to full width once the panel's height is exceeded. */
	.workspace::after {
		content: '';
		display: block;
		clear: both;
	}

	.panel-col {
		float: right;
		width: 0;
		overflow-x: hidden;
		overflow-y: auto;
		max-height: 80vh;
		transition: width 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.workspace.has-panel .panel-col {
		width: 460px;
	}

	.panel-inner {
		width: 460px;
		padding: 18px 20px;
		border: 1px solid var(--rule);
		box-sizing: border-box;
	}

	/* ===== LIST ===== */
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--rule);
	}

	.list-item {
		overflow: hidden; /* BFC: rows sit beside the panel float, not behind it */
	}

	.row {
		display: flex;
		align-items: baseline;
		gap: 20px;
		width: 100%;
		padding: 14px 6px;
		border-bottom: 1px solid var(--rule);
		text-align: left;
		cursor: pointer;
		color: var(--ink);
		background: transparent;
		transition: background 0.12s;
	}

	.row:hover {
		background: rgba(255, 255, 255, 0.025);
	}

	.row.active {
		background: rgba(251, 191, 36, 0.04);
	}

	.cell-date {
		flex-shrink: 0;
		width: 64px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--ink-3);
		letter-spacing: 0.04em;
	}

	.cell-title {
		flex-shrink: 0;
		font-size: 15px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: color 0.15s;
	}

	.row.active .cell-title {
		color: var(--amber);
	}

	.cell-sub {
		flex: 1;
		min-width: 0;
		font-size: 13px;
		color: var(--ink-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.workspace.has-panel .cell-sub {
		display: none;
	}

	.cell-arrow {
		flex-shrink: 0;
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--ink-3);
		transition:
			color 0.15s,
			transform 0.2s;
	}

	.row:hover .cell-arrow,
	.row.active .cell-arrow {
		color: var(--amber);
		transform: translate(2px, -2px);
	}

	/* ===== PANEL ===== */
	.panel-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		padding-bottom: 18px;
		border-bottom: 1px solid var(--rule);
		margin-bottom: 18px;
	}

	.panel-titles h2 {
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 400;
		line-height: 1.1;
		letter-spacing: -0.02em;
		margin: 0;
	}

	.panel-sub {
		margin: 6px 0 0;
		font-size: 13px;
		color: var(--ink-3);
		line-height: 1.4;
	}

	.close-btn {
		flex-shrink: 0;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 1px solid var(--rule);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		line-height: 1;
		color: var(--ink-3);
		transition:
			border-color 0.15s,
			color 0.15s;
	}

	.close-btn:hover {
		border-color: var(--rule-2);
		color: var(--ink);
	}

	.panel-links {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}

	.panel-links a {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--ink-3);
		border: 1px solid var(--rule);
		border-radius: 20px;
		padding: 4px 10px;
		transition:
			border-color 0.15s,
			color 0.15s;
	}

	.panel-links a:hover {
		border-color: var(--amber);
		color: var(--amber);
	}

	.loading {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--ink-3);
		padding: 20px 0;
	}

	/* ===== RESPONSIVE ===== */
	@media (max-width: 960px) {
		.workspace.has-panel .panel-col {
			width: 340px;
		}
		.panel-inner {
			width: 340px;
		}
	}

	@media (max-width: 700px) {
		.panel-col {
			float: none;
			width: 100% !important;
			max-height: none;
			overflow: visible;
			margin-top: 0;
		}
		.panel-inner {
			width: 100%;
			border-top: 1px solid var(--rule);
			border-left: none;
			border-right: none;
			border-bottom: none;
		}
		.list-item {
			overflow: visible;
		}
		.cell-sub {
			display: none;
		}
	}
</style>
