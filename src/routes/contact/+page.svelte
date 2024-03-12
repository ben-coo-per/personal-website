<script lang="ts">
	import { fade } from 'svelte/transition';
	import {
		IconBrandGithub,
		IconBrandInstagram,
		IconBrandLinkedin,
		IconExternalLink,
		IconSend
	} from '@tabler/icons-svelte';

	type ShownState = {
		email: boolean;
		instagram: boolean;
		linkedin: boolean;
		github: boolean;
	};
	let shownState: ShownState = {
		email: false,
		instagram: false,
		linkedin: false,
		github: false
	};

	function show(item: keyof ShownState) {
		shownState[item] = true;
	}
</script>

<section class="text-white p-6 bg-gray-800 h-screen" in:fade={{ duration: 350 }}>
	<div class="container mx-auto relative">
		<h1 class="text-6xl font-serif font-bold">Contact</h1>
		<div class=" mt-6 flex flex-col gap-3">
			<p class="text-xl mb-2">
				Feel free to reach out to me if you have any questions or just want to chat.
			</p>
			<div class="text-md flex flex-row items-center gap-2">
				<IconSend size={32} />
				{#if !shownState.email}
					<button on:click={() => show('email')} class="animate-blur">fakename@email.coo</button>
				{:else}
					<a href="mailto:me@bencooper.xyz" class="flex flex-row gap-1 items-center">
						me@bencooper.xyz
					</a>
				{/if}
			</div>
			<div class="text-md flex flex-row items-center gap-2">
				<IconBrandInstagram size={32} />
				{#if !shownState.instagram}
					<button on:click={() => show('instagram')} class="animate-blur">@fake-instagm</button>
				{:else}
					<a
						href="https://www.instagram.com/ben.coo.per/"
						target="_blank"
						class="flex flex-row gap-1 items-center"
					>
						@ben.coo.per
						<IconExternalLink size={16} class="text-gray-400" />
					</a>
				{/if}
			</div>
			<div class="text-md flex flex-row items-center gap-2">
				<IconBrandLinkedin size={32} />
				{#if !shownState.linkedin}
					<button on:click={() => show('linkedin')} class="animate-blur">fake-linkedin-a</button>
				{:else}
					<a
						href="https://www.linkedin.com/in/ben-a-cooper/"
						class="flex flex-row gap-1 items-center"
						target="_blank"
					>
						ben-a-cooper
						<IconExternalLink size={16} class="text-gray-400" />
					</a>
				{/if}
			</div>
			<div class="text-md flex flex-row items-center gap-2">
				<IconBrandGithub size={32} />
				{#if !shownState.github}
					<button on:click={() => show('github')} class="animate-blur">fake-github-a</button>
				{:else}
					<a
						href="https://github.com/ben-coo-per"
						class="flex flex-row gap-1 items-center"
						target="_blank"
					>
						ben-coo-per
						<IconExternalLink size={16} class="text-gray-400" />
					</a>
				{/if}
			</div>
		</div>
	</div>
</section>
