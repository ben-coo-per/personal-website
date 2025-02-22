<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer class="py-4 px-6 md:px-0 container mx-auto">
	<div class="text-sm text-gray-400">
		<p>&copy; {currentYear} Ben Cooper</p>
		<p>Built with Sveltekit, TailwindCSS, & Sanity.io</p>
		<p>
			Typography by <a
				class="hover:text-amber-200"
				href="https://pangrampangram.com/products/bitmap-mondwest"
				target="_blank"
			>
				PangramPangram
			</a>
		</p>
	</div>
</footer>
