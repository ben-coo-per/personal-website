<script lang="ts">
	import { fade } from 'svelte/transition';
	import ContactSection from '../../components/ContactSection.svelte';
</script>

<section class="text-gray-100 p-6 bg-custom-black h-full" in:fade={{ duration: 350 }}>
	<div class="container mx-auto relative">
		<h1 class="text-6xl font-display font-bold">Contact</h1>
		<div class="my-6 flex flex-col gap-3">
			<p class="text-xl text-gray-200">
				Feel free to reach out and tell me about what you're working on!
			</p>
		</div>
		<ContactSection />
	</div>
</section>
