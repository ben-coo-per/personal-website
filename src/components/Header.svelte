<script lang="ts">
	import { page } from '$app/stores';
	import { cmdkOpen } from '$lib/stores/ui';
	import BrandLogo from './BrandLogo.svelte';

	let mobileMenuOpen = false;

	function openCmdk() {
		cmdkOpen.set(true);
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	const isActive = (path: string) =>
		$page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
</script>

<div class="nav-wrapper">
	<nav class="nav" class:menu-open={mobileMenuOpen}>
		<a class="brand nav-item" href="/projects">
			<BrandLogo />
		</a>
		<ul class="nav-links desktop-links">
			<li><a href="/projects" class:is-active={isActive('/projects')}>projects</a></li>
			<li><a href="/storehouse" class:is-active={isActive('/storehouse')}>storehouse</a></li>
			<li><a href="/about" class:is-active={isActive('/about')}>about</a></li>
		</ul>
		<div class="nav-actions">
			<button class="kbd-btn nav-item" onclick={openCmdk} aria-label="Open command palette">
				<span>search &amp; more</span>
				<kbd>⌘K</kbd>
			</button>
			<button
				class="menu-btn"
				type="button"
				onclick={toggleMobileMenu}
				aria-label="Toggle navigation menu"
				aria-expanded={mobileMenuOpen}
				aria-controls="mobile-nav-links"
			>
				<span class="menu-line"></span>
				<span class="menu-line"></span>
				<span class="menu-line"></span>
			</button>
		</div>
		{#if mobileMenuOpen}
			<ul id="mobile-nav-links" class="nav-links mobile-links">
				<li>
					<a href="/projects" class:is-active={isActive('/projects')} onclick={closeMobileMenu}
						>projects</a
					>
				</li>
				<li>
					<a href="/storehouse" class:is-active={isActive('/storehouse')} onclick={closeMobileMenu}
						>storehouse</a
					>
				</li>
				<li>
					<a href="/about" class:is-active={isActive('/about')} onclick={closeMobileMenu}>about</a>
				</li>
			</ul>
		{/if}
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
	}

	.nav {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		column-gap: 10px;
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
		justify-self: start;
		font-weight: 600;
		letter-spacing: -0.015em;
		font-size: 15px;
		text-decoration: none;
		color: var(--ink);
		transition: color 0.15s;
	}

	.brand:hover,
	.brand:focus-visible {
		color: var(--amber);
	}

	.nav-links {
		display: flex;
		gap: 2px;
		list-style: none;
		margin: 0;
		padding: 0;
		align-items: center;
	}

	.desktop-links {
		justify-self: center;
	}

	.nav-links a {
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

	.nav-links a:hover {
		color: var(--ink);
		background: rgba(255, 255, 255, 0.05);
	}

	.nav-links a.is-active {
		color: var(--ink);
		background: rgba(255, 255, 255, 0.07);
	}

	.nav-actions {
		display: inline-flex;
		justify-self: end;
		align-items: center;
		gap: 8px;
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

	.menu-btn {
		display: none;
		width: 36px;
		height: 36px;
		padding: 0;
		border: 1px solid var(--rule-2);
		border-radius: 999px;
		align-items: center;
		justify-content: center;
		gap: 4px;
		flex-direction: column;
		color: var(--ink);
	}

	.menu-line {
		display: block;
		width: 14px;
		height: 1.5px;
		border-radius: 999px;
		background: currentColor;
	}

	.mobile-links {
		display: none;
	}

	@media (max-width: 600px) {
		.nav {
			grid-template-columns: minmax(0, 1fr) auto;
			row-gap: 10px;
			border-radius: 24px;
		}

		.desktop-links,
		.kbd-btn {
			display: none;
		}

		.menu-btn {
			display: inline-flex;
		}

		.mobile-links {
			display: grid;
			grid-template-columns: 1fr 1fr;
			grid-column: 1 / -1;
			gap: 6px;
			padding-top: 2px;
		}

		.mobile-links a {
			display: block;
			width: 100%;
			padding: 10px 12px;
			text-align: center;
			background: rgba(255, 255, 255, 0.03);
		}

		.menu-open {
			border-radius: 20px;
		}
	}
</style>
