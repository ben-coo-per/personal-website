<svelte:head>
	<title>Storehouse – Ben Cooper</title>
	<meta name="description" content="A dense archive of every project — big, small, and half-finished." />
</svelte:head>

<div class="site">
	<div class="page-head">
		<span class="label">/ storehouse</span>
		<h1>coming soon.</h1>
		<p>A dense archive of every project — big, small, and half-finished. <a href="/projects">← back to projects</a></p>
	</div>
</div>

<style>
	.page-head {
		padding: 60px 6px 80px;
	}

	.label {
		font-family: var(--font-mono);
		font-size: 11.5px;
		color: var(--ink-3);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		display: block;
		margin-bottom: 20px;
	}

	h1 {
		font-family: var(--font-display);
		font-size: clamp(40px, 6vw, 80px);
		line-height: 0.95;
		letter-spacing: -0.03em;
		margin: 0 0 20px;
		font-weight: 400;
	}

	p { font-size: 16px; color: var(--ink-2); line-height: 1.5; }

	a { color: var(--amber); border-bottom: 1px solid rgba(251, 191, 36, 0.3); padding-bottom: 1px; }
	a:hover { border-color: var(--amber); }
</style>
