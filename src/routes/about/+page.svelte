<script lang="ts">
	import StatusEntry from '../../components/StatusEntry.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const about = $derived(data.about);
	const paragraphs = $derived(about?.body ?? []);
	const statuses = $derived(data.statuses ?? []);
</script>

<svelte:head>
	<title>About – Ben Cooper</title>
	<meta name="description" content="About Ben Cooper — engineer, designer, developer. Plus what he's up to lately." />
	<link
		rel="alternate"
		type="application/rss+xml"
		title="Ben Cooper — status"
		href="https://www.bencooper.xyz/status/feed.xml"
	/>
</svelte:head>

<div class="site">
	<div class="page-head">
		<span class="label">/ about</span>
		<h1>
			Hi, <br />
			<em>I'm Ben</em>
		</h1>
	</div>

	<div class="about-layout">
		<section class="feed h-feed" aria-labelledby="feed-title">
			<div class="feed-head">
				<h2 id="feed-title" class="label p-name">/ lately</h2>
				<span class="feed-tools">
					<span class="count">{String(statuses.length).padStart(2, '0')} updates</span>
					<a class="rss" href="/status/feed.xml">rss <span class="arr">↗</span></a>
				</span>
			</div>

			{#each statuses as post, i (post.slug)}
				<StatusEntry {post} featured={i === 0} />
			{/each}

			{#if statuses.length === 0}
				<p class="empty">no updates yet. check back soon.</p>
			{/if}
		</section>

		<aside class="bio">
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
		</aside>
	</div>
</div>

<style>
	.page-head {
		padding: 36px 6px 40px;
		border-bottom: 1px solid var(--rule);
		margin-bottom: 28px;
	}

	.page-head .label {
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

	/* Feed gets the room; bio is a narrow sticky column beside it. */
	.about-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
		gap: 48px;
		align-items: start;
	}

	.bio {
		position: sticky;
		top: 96px;
	}

	.bio .linkgrid {
		grid-template-columns: 1fr;
	}

	.feed {
		min-width: 0;
		padding: 0 6px;
	}

	.feed-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 14px;
		padding-bottom: 6px;
		border-bottom: 1px solid var(--rule);
	}

	.feed-head h2 {
		margin: 0;
		font-weight: 400;
	}

	.feed-tools {
		display: inline-flex;
		gap: 16px;
		align-items: baseline;
	}

	.rss {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--ink-3);
		transition: color 0.15s;
	}

	.rss:hover,
	.rss:hover .arr {
		color: var(--amber);
	}

	.empty {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--ink-3);
		padding: 40px 0;
	}

	@media (max-width: 960px) {
		.about-layout {
			grid-template-columns: 1fr;
			gap: 28px;
		}

		/* On narrow screens the short bio comes first, then the feed. */
		.bio {
			position: static;
			order: -1;
		}
	}
</style>
