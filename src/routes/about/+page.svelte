<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const paragraphs = $derived((data.about?.body ?? []).map((b: { text: string }) => b.text));
</script>

<svelte:head>
	<title>About – Ben Cooper</title>
	<meta name="description" content="About Ben Cooper — engineer, designer, developer." />
</svelte:head>

<div class="site">
	<div class="page-head">
		<span class="label">/ about</span>
		<h1>
			engineer by <em>training</em>,<br />
			designer &amp; developer<br />
			by <em>practice</em>.
		</h1>
	</div>

	<div class="split">
		<div class="panel">
			<h4>bio</h4>
			{#each paragraphs as text}<p>{text}</p>{/each}
			{#if paragraphs.length === 0}
				<p><strong>I'm Ben</strong> — an engineer by training and a designer &amp; developer by practice.</p>
			{/if}
			<div class="linkgrid">
				<a href="https://github.com/ben-coo-per" target="_blank" rel="noreferrer">
					<span class="lbl">github</span><span>ben-coo-per <span class="arr">↗</span></span>
				</a>
				<a href="https://instagram.com/ben.coo.per" target="_blank" rel="noreferrer">
					<span class="lbl">instagram</span><span>ben.coo.per <span class="arr">↗</span></span>
				</a>
				<a href="mailto:hello@bencooper.xyz">
					<span class="lbl">email</span><span>hello@bencooper.xyz <span class="arr">↗</span></span>
				</a>
				<a href="/blog">
					<span class="lbl">writing</span><span>/blog <span class="arr">↗</span></span>
				</a>
			</div>
		</div>

		<div class="panel">
			<h4>now</h4>
			<div class="now-row"><span class="k">working</span><span class="v">climate hardware prototypes <em>/ three days a week</em></span></div>
			<div class="now-row"><span class="k">building</span><span class="v">a mast &amp; boom for a small lateen-rigged dinghy.</span></div>
			<div class="now-row"><span class="k">reading</span><span class="v"><em>How to Make a Book</em> — Erik van Blokland.</span></div>
			<div class="now-row"><span class="k">watching</span><span class="v"><em>Columbo</em>, mostly. It rains a lot lately.</span></div>
			<div class="now-row"><span class="k">riding</span><span class="v">an aluminum Crust Bombora, on the dry days.</span></div>
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

	h1 em { font-style: italic; color: var(--amber); }
</style>
