<script lang="ts">
	import { page } from '$app/stores';
	import NextProjectCard from '../../../components/NextProjectCard.svelte';
	import ProjectHeroVideo from '../../../components/ProjectHeroVideo.svelte';
	import { projectAsset } from '$lib/utils/assets';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let project = $derived($page.data.project);
	// Allow #hex, rgb()/rgba()/hsl()/hsla(), and bare CSS color keywords.
	let safeBg = $derived.by(() => {
		const raw = project?.bgColor?.trim();
		if (!raw) return undefined;
		return /^(#[0-9a-fA-F]{3,8}|(rgb|rgba|hsl|hsla)\([\d\s.,%/-]+\)|[a-zA-Z]+)$/.test(raw)
			? raw
			: undefined;
	});

	let next = $derived($page.data.next);

	let hero = $derived.by(() => {
		if (!project?.heroVideo) return undefined;
		const asset = projectAsset(project.slug);
		return {
			src: asset(project.heroVideo),
			poster: project.heroPoster ? asset(project.heroPoster) : undefined,
			tone: project.heroTone
		};
	});
</script>

<svelte:head>
	{#if safeBg}
		{@html `<style>html, body { background-color: ${safeBg} !important; }</style>`}
	{/if}
</svelte:head>

<div
	class="site"
	class:bare={project?.bareLayout}
	class:has-hero={hero}
	class:on-hero-video={hero}
	data-hero-tone={hero?.tone}
>
	{#if hero}
		<ProjectHeroVideo src={hero.src} poster={hero.poster} label={project.title} />
	{/if}

	{#if !project?.bareLayout}
		<a class="back" href="/projects">← projects</a>
	{/if}

	{#if project && !project.bareLayout}
		<div class="article-head">
			<div class="eyebrow">{project.date?.getFullYear() ?? ''}</div>
			<h1>{project.title}</h1>
			{#if project.subtitle}
				<p class="subtitle">{project.subtitle}</p>
			{/if}
			{#if project.mainDescription}
				<p class="desc">{project.mainDescription}</p>
			{/if}
			{#if project.websiteUrl || project.githubLink}
				<div class="head-links">
					{#if project.websiteUrl}
						<a href={project.websiteUrl} target="_blank" rel="noopener noreferrer">website ↗</a>
					{/if}
					{#if project.githubLink}
						<a href={project.githubLink} target="_blank" rel="noopener noreferrer">github ↗</a>
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	{@render children?.()}

	{#if next && next.slug !== project.slug}
		<div class="next-project h-96">
			<NextProjectCard project={next} />
		</div>
	{/if}
</div>

<style>
	/* The page is its own whole layout, edge to edge, with its own title. */
	.bare {
		max-width: none;
		padding: 0 0 80px;
	}

	/* Title over a hero video: it fills the first screen and fades out on scroll. */
	.has-hero > :global(.back),
	.has-hero > .article-head {
		opacity: var(--hero-fade, 1);
	}

	.has-hero > .article-head {
		min-height: calc(100svh - var(--hero-offset, 120px));
		margin-bottom: clamp(160px, 35vh, 420px);
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		padding-bottom: 56px;
		border-bottom: 0;
		text-shadow: var(--hero-shadow);
	}

	.has-hero[data-hero-tone='light'] {
		--hero-shadow: 0 1px 18px rgba(0, 0, 0, 0.35);
	}

	.has-hero[data-hero-tone='light'] > :global(.back),
	.has-hero[data-hero-tone='light'] > .article-head :is(.eyebrow, .subtitle, .desc) {
		color: rgba(255, 255, 255, 0.85);
	}

	.has-hero[data-hero-tone='dark'] > :global(.back),
	.has-hero[data-hero-tone='dark'] > .article-head :is(h1, .eyebrow, .subtitle, .desc, .head-links a) {
		color: #24121f;
	}

	.has-hero[data-hero-tone='dark'] > .article-head :is(.eyebrow, .subtitle, .desc) {
		color: rgba(36, 18, 31, 0.78);
	}

	.has-hero[data-hero-tone='dark'] .head-links a {
		border-color: rgba(36, 18, 31, 0.3);
	}

	.desc {
		margin-top: 14px;
		font-size: 15px;
		line-height: 1.6;
		color: var(--ink-3);
		max-width: var(--max-width-prose);
	}

	.head-links {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-top: 16px;
	}

	.head-links a {
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

	.head-links a:hover {
		border-color: var(--amber);
		color: var(--amber);
	}

	.next-project {
		margin-top: 0px;
		padding: 0px;
		border-top: 1px solid var(--rule);
		margin-bottom: -80px;
	}
</style>
