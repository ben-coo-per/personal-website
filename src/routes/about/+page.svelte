<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const about = $derived(data.about);
	const paragraphs = $derived(about?.body ?? []);

	const nowRows = $derived<[string, string[]][]>([
		['building', about?.building ?? []],
		['reading', about?.reading ?? []],
		['watching', about?.watching ?? []],
		['playing', about?.playing ?? []]
	]);
</script>

<svelte:head>
	<title>About – Ben Cooper</title>
	<meta name="description" content="About Ben Cooper — engineer, designer, developer." />
</svelte:head>

<div class="site">
	<div class="page-head">
		<span class="label">/ about</span>
		<h1>
			Hi, <br />
			<em>I'm Ben</em>
		</h1>
	</div>

	<div class="split">
		<div class="panel">
			<h4>bio</h4>
			{#each paragraphs as p}<p>{@html p.html}</p>{/each}
			<div class="linkgrid">
				{#if about?.github}
					<a href="https://github.com/{about.github}" target="_blank" rel="noreferrer">
						<span class="lbl">github</span><span>{about.github} <span class="arr">↗</span></span>
					</a>
				{/if}
				{#if about?.instagram}
					<a href="https://instagram.com/{about.instagram}" target="_blank" rel="noreferrer">
						<span class="lbl">instagram</span><span
							>{about.instagram} <span class="arr">↗</span></span
						>
					</a>
				{/if}
				{#if about?.email}
					<a href="mailto:{about.email}">
						<span class="lbl">email</span><span>{about.email} <span class="arr">↗</span></span>
					</a>
				{/if}
				{#if about?.linkedin}
					<a href="https://linkedin.com/in/{about.linkedin}" target="_blank" rel="noreferrer">
						<span class="lbl">linkedin</span><span
							>{about.linkedin} <span class="arr">↗</span></span
						>
					</a>
				{/if}
			</div>
		</div>

		<div class="panel">
			<h4>Currently</h4>
			{#each nowRows as [label, entries]}
				{#if entries.length > 0}
					<div class="now-row">
						<span class="k">{label}</span>
						<span class="v">
							{#each entries as entry}
								<span class="entry">{@html entry}</span>
							{/each}
						</span>
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>

<style>
	.page-head {
		padding: 36px 6px 48px;
		border-bottom: 1px solid var(--rule);
		margin-bottom: 32px;
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
		font-size: clamp(36px, 5vw, 72px);
		line-height: 0.95;
		letter-spacing: -0.03em;
		margin: 0;
		font-weight: 400;
	}

	h1 em {
		font-style: italic;
		color: var(--amber);
	}

	.now-row .v {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.now-row .v .entry {
		display: block;
	}

	.now-row .v :global(a) {
		text-decoration: underline;
		text-underline-offset: 5px;
	}

	.now-row .v :global(a):hover {
		opacity: 0.8;
	}
</style>
