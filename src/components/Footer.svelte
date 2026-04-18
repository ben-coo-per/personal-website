<script lang="ts">
	import { cmdkOpen } from '$lib/stores/ui';
	const currentYear = new Date().getFullYear();
</script>

<footer class="foot">
	<div class="inner">
		<span>© {currentYear} Ben Cooper</span>
		<div class="right">
			<span>Rubik + Mondwest</span>
			<span>|</span>
			<span>SvelteKit</span>
			<span>|</span>
			<span>KirbyCMS</span>
			<span>|</span>
			<button onclick={() => cmdkOpen.set(true)}>⌘K</button>
		</div>
	</div>
</footer>

<style>
	.foot {
		margin-top: auto;
	}

	.inner {
		max-width: var(--maxw);
		margin: 0 auto;
		padding: 22px var(--pad) 40px;
		border-top: 1px solid var(--rule);
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-family: var(--font-mono);
		font-size: 11.5px;
		color: var(--ink-3);
		letter-spacing: 0.02em;
		flex-wrap: wrap;
		gap: 10px;
	}

	.right {
		display: flex;
		gap: 14px;
		flex-wrap: wrap;
		align-items: center;
	}

	button {
		font-family: var(--font-mono);
		font-size: 11.5px;
		color: var(--ink-3);
		transition: color 0.15s;
	}

	button:hover {
		color: var(--ink);
	}

	@media (max-width: 700px) {
		button,
		.right > span:last-of-type {
			display: none;
		}
	}
</style>
