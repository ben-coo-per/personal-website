<script lang="ts">
	import type { PageData } from './$types';
	import type { ProjectMetadata } from '$lib/types';
	import type { ExportMode, ExportProgress, PageSize, Quality, Theme } from '$lib/export';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const AUTHOR = 'Ben Cooper';
	const SITE = 'bencooper.xyz';

	let selected = $state<Set<string>>(new Set(data.curated.map((p) => p.slug)));
	let size = $state<PageSize>('A4');
	let theme = $state<Theme>('paper');
	let quality = $state<Quality>('screen');
	let busy = $state<string | null>(null);
	let progress = $state<ExportProgress | null>(null);
	let errorMsg = $state<string | null>(null);

	const all = $derived([...data.curated, ...data.storehouse]);
	const chosen = $derived(all.filter((p) => selected.has(p.slug)));

	// The preset buttons reflect the live selection: exactly these projects, no more, no fewer.
	const isExactly = (projects: ProjectMetadata[]) =>
		selected.size === projects.length && projects.every((p) => selected.has(p.slug));
	const preset = $derived<'all' | 'curated' | 'none' | null>(
		selected.size === 0
			? 'none'
			: isExactly(all)
				? 'all'
				: isExactly(data.curated)
					? 'curated'
					: null
	);

	function toggle(slug: string) {
		const next = new Set(selected);
		if (next.has(slug)) next.delete(slug);
		else next.add(slug);
		selected = next;
	}

	function select(projects: ProjectMetadata[]) {
		selected = new Set(projects.map((p) => p.slug));
	}

	async function run(projects: ProjectMetadata[], mode: ExportMode, label: string) {
		if (busy || !projects.length) return;
		busy = label;
		errorMsg = null;
		progress = { phase: 'fonts', fraction: 0, detail: 'starting' };
		try {
			const { exportProjects, downloadBlob } = await import('$lib/export');
			const result = await exportProjects(
				projects,
				mode,
				{
					size,
					theme,
					quality,
					author: AUTHOR,
					site: SITE,
					email: data.email,
					tagline: data.tagline
				},
				(p) => (progress = p)
			);
			downloadBlob(result);
		} catch (err) {
			console.error(err);
			errorMsg = err instanceof Error ? err.message : 'export failed';
		} finally {
			busy = null;
			setTimeout(() => (progress = null), 1200);
		}
	}

	function year(p: ProjectMetadata) {
		return p.date.getFullYear();
	}
</script>

<div class="site">
	<a class="back" href="/projects">← projects</a>

	<div class="sec-head">
		<span class="label">/ export</span>
		<span class="count">{String(chosen.length).padStart(2, '0')} selected</span>
	</div>

	<div class="intro">
		<div class="panel">
			<h4>portfolio book</h4>
			<p>
				Pick projects and export them as a bound PDF — cover, contents, then a set of pages per
				project — or as one PDF per project, zipped. Everything renders here in the browser with
				real type and embedded images, not a screenshot of the page.
			</p>
		</div>
		<div class="panel options">
			<h4>options</h4>
			<div class="opt-row">
				<span class="k">select</span>
				<div class="seg">
					<button class:on={preset === 'all'} onclick={() => select(all)}>all</button>
					<button class:on={preset === 'curated'} onclick={() => select(data.curated)}
						>curated</button
					>
					<button class:on={preset === 'none'} onclick={() => select([])}>none</button>
				</div>
			</div>
			<div class="opt-row">
				<span class="k">paper</span>
				<div class="seg">
					<button class:on={size === 'A4'} onclick={() => (size = 'A4')}>A4</button>
					<button class:on={size === 'LETTER'} onclick={() => (size = 'LETTER')}>Letter</button>
				</div>
			</div>
			<div class="opt-row">
				<span class="k">images</span>
				<div class="seg">
					<button class:on={quality === 'screen'} onclick={() => (quality = 'screen')}
						>screen</button
					>
					<button class:on={quality === 'print'} onclick={() => (quality = 'print')}>print</button>
				</div>
			</div>
			<div class="opt-row">
				<span class="k">theme</span>
				<div class="seg">
					<button class:on={theme === 'paper'} onclick={() => (theme = 'paper')}>paper</button>
					<button class:on={theme === 'ink'} onclick={() => (theme = 'ink')}>ink</button>
				</div>
			</div>
		</div>
	</div>

	{#snippet group(label: string, projects: ProjectMetadata[])}
		{#if projects.length}
			<div class="grp-head">
				<span class="label">{label}</span>
				<span class="count">{String(projects.length).padStart(2, '0')}</span>
			</div>
			<ul class="list">
				{#each projects as p (p.slug)}
					<li class="row" class:on={selected.has(p.slug)}>
						<label class="pick">
							<input
								type="checkbox"
								checked={selected.has(p.slug)}
								onchange={() => toggle(p.slug)}
							/>
							<span class="box" aria-hidden="true"></span>
							<span class="yr">{year(p)}</span>
							<span class="ttl">
								{p.title}
								{#if p.isRestricted}<span class="tag">confidential</span>{/if}
								{#if p.wip}<span class="tag">wip</span>{/if}
							</span>
							<span class="sub">{p.subtitle ?? ''}</span>
						</label>
						<button
							class="one"
							disabled={!!busy}
							onclick={() => run([p], 'single', p.slug)}
							title="Export just this project"
						>
							{busy === p.slug ? '…' : 'pdf ↓'}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	{/snippet}

	{@render group('/ curated work', data.curated)}
	{@render group('/ storehouse', data.storehouse)}

	{#if !data.restrictedAccess}
		<p class="note">Confidential projects are included only after unlocking them via ⌘K.</p>
	{/if}
</div>

<div class="bar" class:active={!!progress}>
	<div class="bar-inner">
		<div class="status">
			{#if progress}
				<span class="detail">{progress.detail}</span>
				<span class="track"
					><span class="fill" style:width="{progress.fraction * 100}%"></span></span
				>
			{:else if errorMsg}
				<span class="detail err">{errorMsg}</span>
			{:else}
				<span class="detail"
					>{String(chosen.length).padStart(2, '0')} selected · {size} · {theme} · {quality}</span
				>
			{/if}
		</div>
		<div class="actions">
			<button
				class="ghost"
				disabled={!!busy || !chosen.length}
				onclick={() => run(chosen, 'zip', 'zip')}
			>
				{busy === 'zip' ? 'exporting…' : 'separate pdfs (zip)'}
			</button>
			<button
				class="primary"
				disabled={!!busy || !chosen.length}
				onclick={() => run(chosen, 'book', 'book')}
			>
				{busy === 'book' ? 'exporting…' : 'export book ↓'}
			</button>
		</div>
	</div>
</div>

<style>
	.site {
		padding-bottom: 140px;
	}

	.intro {
		display: grid;
		grid-template-columns: 1.3fr 1fr;
		gap: 20px;
		margin-bottom: 8px;
	}

	.options .opt-row {
		display: grid;
		grid-template-columns: 56px 1fr;
		align-items: center;
		gap: 12px;
		padding: 8px 0;
		border-bottom: 1px dashed var(--rule);
	}

	.options .opt-row:last-child {
		border-bottom: none;
	}

	.options .k {
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.seg {
		display: flex;
		gap: 4px;
	}

	.seg button {
		font-family: var(--font-mono);
		font-size: 11.5px;
		color: var(--ink-2);
		padding: 5px 10px;
		border: 1px solid var(--rule);
		border-radius: 6px;
		transition:
			border-color 0.15s,
			color 0.15s,
			background 0.15s;
	}

	.seg button:hover {
		border-color: var(--rule-2);
		color: var(--ink);
	}

	.seg button.on {
		border-color: var(--amber);
		color: var(--amber);
		background: rgba(251, 191, 36, 0.08);
	}

	.grp-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 28px 6px 10px;
		margin-top: 16px;
		border-top: 1px solid var(--rule);
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		border-bottom: 1px solid var(--rule);
		transition: background 0.1s;
	}

	.row:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.pick {
		flex: 1;
		display: grid;
		grid-template-columns: 16px 44px minmax(120px, 0.6fr) 1fr;
		align-items: center;
		gap: 14px;
		padding: 12px 6px;
		cursor: pointer;
		min-width: 0;
	}

	.pick input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.box {
		width: 14px;
		height: 14px;
		border: 1px solid var(--rule-2);
		border-radius: 3px;
		position: relative;
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.row.on .box {
		border-color: var(--amber);
		background: var(--amber);
	}

	.row.on .box::after {
		content: '';
		position: absolute;
		left: 4px;
		top: 1px;
		width: 4px;
		height: 8px;
		border: solid #0a0a0b;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}

	.yr {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--ink-3);
	}

	.ttl {
		font-size: 14.5px;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.row:not(.on) .ttl {
		color: var(--ink-2);
	}

	.tag {
		font-family: var(--font-mono);
		font-size: 9.5px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		border: 1px solid var(--rule);
		border-radius: 20px;
		padding: 1px 6px;
		margin-left: 6px;
		vertical-align: middle;
	}

	.sub {
		font-size: 13px;
		color: var(--ink-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.one {
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--ink-3);
		border: 1px solid var(--rule);
		border-radius: 20px;
		padding: 4px 10px;
		margin-right: 6px;
		transition:
			border-color 0.15s,
			color 0.15s;
	}

	.one:hover:not(:disabled) {
		border-color: var(--amber);
		color: var(--amber);
	}

	.one:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.note {
		margin: 20px 6px 0;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--ink-3);
	}

	/* ===== STICKY ACTION BAR ===== */
	.bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 50;
		padding: 14px var(--pad) 18px;
		background: linear-gradient(to top, rgba(10, 10, 11, 0.95), rgba(10, 10, 11, 0.7));
		backdrop-filter: blur(8px);
		border-top: 1px solid var(--rule);
	}

	.bar-inner {
		max-width: var(--maxw);
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
	}

	.status {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.detail {
		font-family: var(--font-mono);
		font-size: 11.5px;
		color: var(--ink-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.detail.err {
		color: #ff6161;
	}

	.track {
		display: block;
		height: 2px;
		background: var(--rule);
		border-radius: 2px;
		overflow: hidden;
		max-width: 420px;
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--amber);
		transition: width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.actions {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}

	.actions button {
		font-family: var(--font-mono);
		font-size: 12px;
		border-radius: 8px;
		padding: 10px 16px;
		transition:
			border-color 0.15s,
			color 0.15s,
			opacity 0.15s;
	}

	.actions button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.ghost {
		color: var(--ink-2);
		border: 1px solid var(--rule-2);
	}

	.ghost:hover:not(:disabled) {
		border-color: var(--amber);
		color: var(--amber);
	}

	.primary {
		background: var(--amber);
		color: #0a0a0b;
		font-weight: 600;
	}

	@media (max-width: 800px) {
		.intro {
			grid-template-columns: 1fr;
		}

		.pick {
			grid-template-columns: 16px 44px 1fr;
		}

		.sub {
			display: none;
		}

		.bar-inner {
			flex-direction: column;
			align-items: stretch;
		}

		.actions button {
			flex: 1;
		}
	}
</style>
