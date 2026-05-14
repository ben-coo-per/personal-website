<script lang="ts">
	import { tick } from 'svelte';
	import type { PageData } from './$types';
	import type { ProjectMetadata } from '$lib/types';
	import { ditherImages } from '$lib/actions/ditherImages';
	import { imageScrollers } from '$lib/actions/imageScrollers';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let selected: ProjectMetadata | null = $state(null);
	let panelHtml = $state('');
	let panelLoading = $state(false);
	let listEl: HTMLUListElement | null = $state(null);
	let panelColEl: HTMLDivElement | null = $state(null);
	let desktopPanelTop = $state(0);
	let desktopPanelHeight = $state(0);
	let panelScrollHintDismissed = $state(false);
	let showPanelScrollCue = $state(false);

	const PANEL_VISIBLE_ROW_COUNT = 9;
	const MOBILE_BREAKPOINT = 700;

	const projectCount = $derived(data.projects.length);
	const selectedIndex = $derived.by(() => {
		if (!selected) {
			return -1;
		}
		const selectedSlug = selected.slug;
		return data.projects.findIndex((project) => project.slug === selectedSlug);
	});

	const panelStartIndex = $derived.by(() => {
		if (selectedIndex < 0) {
			return -1;
		}
		const maxStartIndex = Math.max(0, data.projects.length - PANEL_VISIBLE_ROW_COUNT);
		return Math.min(selectedIndex, maxStartIndex);
	});

	const panelEndIndex = $derived.by(() => {
		if (panelStartIndex < 0) {
			return -1;
		}
		return Math.min(data.projects.length - 1, panelStartIndex + PANEL_VISIBLE_ROW_COUNT - 1);
	});

	async function openProject(project: ProjectMetadata) {
		if (selected?.slug === project.slug) {
			selected = null;
			showPanelScrollCue = false;
			return;
		}
		selected = project;
		panelHtml = '';
		panelLoading = true;
		panelScrollHintDismissed = false;
		showPanelScrollCue = false;
		void tick().then(() => {
			if (panelColEl) {
				panelColEl.scrollTop = 0;
			}
			updatePanelScrollCue();
		});
		try {
			const res = await fetch(`/api/project-content/${project.slug}`);
			const body = await res.json();
			panelHtml = body.html;
		} finally {
			panelLoading = false;
		}
	}

	function updateDesktopPanelGeometry() {
		if (
			typeof window === 'undefined' ||
			window.innerWidth <= MOBILE_BREAKPOINT ||
			!selected ||
			panelStartIndex < 0 ||
			panelEndIndex < 0 ||
			!listEl
		) {
			desktopPanelTop = 0;
			desktopPanelHeight = 0;
			return;
		}

		const rows = listEl.querySelectorAll<HTMLButtonElement>('.list-item .row');
		const startRow = rows[panelStartIndex];
		const endRow = rows[panelEndIndex];
		if (!startRow || !endRow) {
			desktopPanelTop = 0;
			desktopPanelHeight = 0;
			return;
		}

		const listRect = listEl.getBoundingClientRect();
		const startRect = startRow.getBoundingClientRect();
		const endRect = endRow.getBoundingClientRect();

		desktopPanelTop = Math.max(0, startRect.top - listRect.top);
		desktopPanelHeight = Math.max(0, endRect.bottom - startRect.top);
	}

	function updatePanelScrollCue() {
		if (
			typeof window === 'undefined' ||
			window.innerWidth <= MOBILE_BREAKPOINT ||
			!selected ||
			!panelColEl
		) {
			showPanelScrollCue = false;
			return;
		}

		const hasOverflow = panelColEl.scrollHeight - panelColEl.clientHeight > 10;
		const nearBottom =
			panelColEl.scrollTop + panelColEl.clientHeight >= panelColEl.scrollHeight - 8;
		showPanelScrollCue = hasOverflow && !nearBottom && !panelScrollHintDismissed;
	}

	function handlePanelScroll() {
		if (!panelColEl) {
			return;
		}
		if (panelColEl.scrollTop > 8) {
			panelScrollHintDismissed = true;
		}
		updatePanelScrollCue();
	}

	function isCompressedRow(index: number) {
		return panelStartIndex >= 0 && index >= panelStartIndex && index <= panelEndIndex;
	}

	$effect(() => {
		selectedIndex;
		panelStartIndex;
		panelEndIndex;
		panelHtml;
		panelLoading;
		void tick().then(() => {
			updateDesktopPanelGeometry();
			updatePanelScrollCue();
		});
	});

	$effect(() => {
		if (typeof window === 'undefined') {
			return;
		}
		const handleResize = () => {
			updateDesktopPanelGeometry();
			updatePanelScrollCue();
		};
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	function closePanel() {
		selected = null;
		panelScrollHintDismissed = false;
		showPanelScrollCue = false;
	}

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
		<!-- panel is absolutely positioned and aligned to a row window on desktop -->
		<div
			class="panel-col"
			bind:this={panelColEl}
			onscroll={handlePanelScroll}
			aria-hidden={!selected}
			style:top={selected ? `${desktopPanelTop}px` : '0px'}
			style:height={selected ? `${desktopPanelHeight}px` : '0px'}
		>
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

					{#if selected.websiteUrl || selected.githubLink || selected.instagramLink || selected.onshapeLink || selected.downloadableFile}
						<div class="panel-links">
							{#if selected.websiteUrl}
								<a href={selected.websiteUrl} target="_blank" rel="noopener noreferrer"
									>website ↗</a
								>
							{/if}
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
						<div class="main-description">{selected.mainDescription}</div>
						{#if panelLoading}
							<p class="loading">loading…</p>
						{:else if panelHtml}
							<div class="article-body" use:ditherImages use:imageScrollers>{@html panelHtml}</div>
						{/if}
					</div>
				{/if}
			</div>
			{#if showPanelScrollCue}
				<div class="panel-scroll-cue" aria-hidden="true">
					<span>Scroll for more</span>
				</div>
			{/if}
		</div>

		<ul class="list" bind:this={listEl}>
			{#each data.projects as project, index}
				<li class="list-item">
					<button
						class="row"
						class:active={selected?.slug === project.slug}
						class:compressed={isCompressedRow(index)}
						onclick={() => openProject(project)}
						type="button"
					>
						<span class="cell-date">{formatDate(project.date)}</span>
						<span class="cell-title">{project.title ?? ''}</span>
						<span class="cell-sub">{project.subtitle ?? ''}</span>
						<span class="cell-arrow">↗</span>
					</button>
				</li>
				{#if selected?.slug === project.slug}
					<li class="accordion-panel">
						<div class="accordion-inner">
							<div class="panel-head">
								<div class="panel-titles">
									<h2>{selected.title}</h2>
									{#if selected.subtitle}
										<p class="panel-sub">{selected.subtitle}</p>
									{/if}
								</div>
								<button class="close-btn" onclick={closePanel} aria-label="Close panel">×</button>
							</div>

							{#if selected.websiteUrl || selected.githubLink || selected.instagramLink || selected.onshapeLink || selected.downloadableFile}
								<div class="panel-links">
									{#if selected.websiteUrl}
										<a href={selected.websiteUrl} target="_blank" rel="noopener noreferrer"
											>website ↗</a
										>
									{/if}
									{#if selected.githubLink}
										<a href={selected.githubLink} target="_blank" rel="noopener noreferrer"
											>github ↗</a
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
										<a
											href="/cms-assets/projects/{selected.slug}/{selected.downloadableFile}"
											download
										>
											download ↓
										</a>
									{/if}
								</div>
							{/if}

							<div class="panel-body">
								{#if panelLoading}
									<p class="loading">loading…</p>
								{:else if panelHtml}
									<div class="article-body" use:ditherImages use:imageScrollers>{@html panelHtml}</div>
								{/if}
							</div>
						</div>
					</li>
				{/if}
			{/each}
		</ul>
	</div>
</div>

<style>
	/* ===== LAYOUT ===== */
	.workspace {
		position: relative;
		--desktop-panel-width: min(50vw, 640px);
	}

	.panel-col {
		position: absolute;
		right: 0;
		top: 0;
		width: 0;
		height: 0;
		overflow-x: hidden;
		overflow-y: auto;
		z-index: 2;
		transition: width 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
		background: rgba(17, 17, 20, 0.6);
		backdrop-filter: blur(8px);
		border: 1px solid var(--rule);
		scrollbar-width: thin;
		scrollbar-color: var(--ink-2) rgba(255, 255, 255, 0.04);
	}

	.panel-col::-webkit-scrollbar {
		width: 8px;
	}

	.panel-col::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.04);
	}

	.panel-col::-webkit-scrollbar-thumb {
		background: color-mix(in oklab, var(--ink-2) 82%, var(--amber) 18%);
		border: 2px solid rgba(0, 0, 0, 0);
		background-clip: padding-box;
		border-radius: 999px;
	}

	.panel-col::-webkit-scrollbar-thumb:hover {
		background: color-mix(in oklab, var(--ink) 72%, var(--amber) 28%);
	}

	.panel-scroll-cue {
		position: sticky;
		bottom: 0;
		display: flex;
		justify-content: center;
		padding: 26px 0 10px;
		pointer-events: none;
		background: linear-gradient(
			to bottom,
			rgba(0, 0, 0, 0) 0%,
			color-mix(in oklab, var(--bg) 88%, black 12%) 68%
		);
	}

	.panel-scroll-cue span {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: color-mix(in oklab, var(--ink-3) 76%, var(--amber) 24%);
		padding: 4px 8px;
		border: 1px solid color-mix(in oklab, var(--rule) 74%, var(--amber) 26%);
		border-radius: 999px;
		background: color-mix(in oklab, var(--bg) 80%, black 20%);
	}

	.workspace.has-panel .panel-col {
		width: var(--desktop-panel-width);
	}

	.panel-inner {
		width: var(--desktop-panel-width);
		padding: 18px 20px;
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
		overflow: hidden;
	}

	.main-description {
		display: block;
		margin-bottom: 12px;
		font-size: 14px;
		color: var(--ink-2);
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
		background: rgba(17, 17, 20, 0.5);
		backdrop-filter: blur(4px);
		transition: background 0.12s;
	}

	.row:hover {
		background: rgba(23, 23, 28, 0.7);
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
		.workspace {
			--desktop-panel-width: 340px;
		}
	}

	@media (min-width: 701px) {
		.accordion-panel {
			display: none;
		}

		.workspace.has-panel .row.compressed {
			width: calc(100% - var(--desktop-panel-width));
		}
	}

	@media (max-width: 700px) {
		.panel-col {
			display: none;
		}

		.list-item {
			overflow: visible;
		}

		.cell-sub {
			display: none;
		}

		.accordion-panel {
			overflow: visible;
			list-style: none;
		}

		.accordion-inner {
			padding: 18px 6px 18px 6px;
			border-bottom: 1px solid var(--rule);
		}

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
	}
</style>
