<script lang="ts">
	import { page } from '$app/stores';
	import { cmdkOpen } from '$lib/stores/ui';

	function openCmdk() {
		cmdkOpen.set(true);
	}

	const isActive = (path: string) =>
		$page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
</script>

<div class="nav-wrapper">
	<nav class="nav">
		<a class="brand" href="/projects">
			<!-- TODO: Add dynamic logo -->
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M3 12L12 3L21 12M3 12L12 21L21 12"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</a>
		<ul>
			<li><a href="/projects" class:is-active={isActive('/projects')}>projects</a></li>
			<li><a href="/storehouse" class:is-active={isActive('/storehouse')}>storehouse</a></li>
			<li><a href="/blog" class:is-active={isActive('/blog')}>writing</a></li>
			<li><a href="/about" class:is-active={isActive('/about')}>about</a></li>
		</ul>
		<button class="kbd-btn" onclick={openCmdk} aria-label="Open command palette">
			<span>search &amp; more</span>
			<kbd>⌘K</kbd>
		</button>
	</nav>
</div>

<style>
	.nav-wrapper {
		max-width: var(--maxw);
		width: 100%;
		margin: 0 auto;
		padding: 14px var(--pad) 0;
		position: sticky;
		top: 0;
		z-index: 30;
		/* extend bg behind the wrapper so sticky doesn't show gaps */
		background: var(--bg);
	}

	.nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 14px;
		border: 1px solid var(--rule);
		background: rgba(10, 10, 11, 0.7);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border-radius: 999px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		font-weight: 600;
		letter-spacing: -0.015em;
		font-size: 15px;
		text-decoration: none;
		color: var(--ink);
	}

	ul {
		display: flex;
		gap: 2px;
		list-style: none;
		margin: 0;
		padding: 0;
		align-items: center;
	}

	ul a {
		display: inline-block;
		padding: 7px 12px;
		font-size: 13px;
		color: var(--ink-2);
		border-radius: 999px;
		transition:
			color 0.15s,
			background 0.15s;
		text-decoration: none;
	}

	ul a:hover {
		color: var(--ink);
		background: rgba(255, 255, 255, 0.05);
	}

	ul a.is-active {
		color: var(--ink);
		background: rgba(255, 255, 255, 0.07);
	}

	.kbd-btn {
		display: inline-flex;
		gap: 6px;
		align-items: center;
		padding: 6px 10px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--ink-2);
		border: 1px solid var(--rule-2);
		border-radius: 999px;
		transition:
			color 0.15s,
			border-color 0.15s,
			background 0.15s;
		cursor: pointer;
	}

	.kbd-btn:hover {
		color: var(--ink);
		border-color: var(--ink-3);
		background: rgba(255, 255, 255, 0.04);
	}

	.kbd-btn kbd {
		font-family: var(--font-mono);
		font-size: 10.5px;
		padding: 1px 5px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--rule-2);
		border-radius: 4px;
	}

	@media (max-width: 600px) {
		ul li:nth-child(3),
		ul li:nth-child(4) {
			display: none;
		}

		.kbd-btn span {
			display: none;
		}
	}
</style>
