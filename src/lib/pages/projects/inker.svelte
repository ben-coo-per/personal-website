<script lang="ts">
	import type { FreeformPageProps } from '.';
	import Eye from '$lib/ink/Eye.svelte';
	import InkCanvas from '$lib/ink/InkCanvas.svelte';
	import Octopus from '$lib/ink/Octopus.svelte';
	import { start as lockup } from '$lib/ink/lockup';

	let { project, asset }: FreeformPageProps = $props();

	// The page wears INKER's brand, not this site's: see the .inker rules in log.css.
	// Copy comes from inker.sh; the live site is the long version.
	const site = $derived(project.websiteUrl ?? 'https://inker.sh');
	const github = $derived(project.githubLink ?? 'https://github.com/Inker-App/inker');
	const facts = ['LOCAL ONLY', 'WORKS OVER MCP', 'MACOS'];
</script>

<svelte:head>
	<link
		href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="inker">
	<div class="inker__wrap">
		<nav class="inker__nav">
			<a href={site} target="_blank" rel="noopener noreferrer">
				<InkCanvas start={lockup} label="INKER" class="inker__lock" />
			</a>
			<div>
				<a href="{site}/how" target="_blank" rel="noopener noreferrer">How it works</a>
				<a href={github} target="_blank" rel="noopener noreferrer">GitHub</a>
				<span>macOS · coming soon</span>
			</div>
		</nav>

		<section class="inker__hero">
			<div class="inker__copy">
				<h2>You trust your agent too much.</h2>
				<p>
					Hand your chat a <span class="inker__handle">🐙/</span> handle instead of the file. It gets
					the amounts it needs and never sees your name, SSN or account numbers.
				</p>
				<div class="inker__buttons">
					<a class="inker__btn inker__btn--fill" href={site} target="_blank" rel="noopener noreferrer">
						Visit inker.sh
					</a>
					<a class="inker__btn" href={github} target="_blank" rel="noopener noreferrer">
						View on GitHub
					</a>
				</div>
			</div>
			<Octopus poster={asset('preview.png')} alt="INKER's dot-shaded octopus" class="inker__octopus" />
		</section>

		<ol class="inker__steps">
			<li>
				<div class="inker__n">01</div>
				<div class="inker__title">Hide the file</div>
				<p>The file moves out of Downloads into a folder nothing else can read.</p>
			</li>
			<li>
				<div class="inker__n">02</div>
				<div class="inker__title">Paste <span class="inker__handle">🐙/w2-acme-2025</span></div>
				<p>The handle lands on your clipboard. Drop it into any chat.</p>
			</li>
			<li>
				<div class="inker__n">03</div>
				<div class="inker__title">
					Your chat reads the safe copy
					<Eye size={64} squint={0.45} style="width: 24px; height: 24px" />
				</div>
				<p>
					Names, SSNs and account numbers are replaced by placeholders. Anything it writes back gets
					the real values filled in, on your Mac only.
				</p>
			</li>
		</ol>
	</div>

	<section class="inker__facts">
		<Eye size={160} class="inker__eye inker__eye--left" />
		<Eye size={96} class="inker__eye inker__eye--right" />
		<div>
			{#each facts as fact}<span>{fact}</span>{/each}
		</div>
	</section>

	<footer class="inker__foot">
		<div>
			<a href={site} target="_blank" rel="noopener noreferrer">inker.sh ↗</a>
			<a href={github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
		</div>
		<span>Your sensitive documents stay on your Mac.</span>
	</footer>
</div>
