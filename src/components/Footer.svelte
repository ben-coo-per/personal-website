<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer class="py-4 px-2">
	<div class="text-sm text-gray-400">
		<p>&copy; {currentYear} Ben Cooper</p>
		<p>Built with Sveltekit, TailwindCSS, & Sanity.io</p>
		<p>
			Typography by <a href="https://pangrampangram.com/products/bitmap-mondwest" target="_blank">
				PangramPangram
			</a>
		</p>
	</div>
</footer>

<style lang="scss">
	a {
		&:hover {
			@apply text-yellow-200;
		}
	}
</style>
