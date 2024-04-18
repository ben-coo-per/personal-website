<script lang="ts">
	import { fade } from 'svelte/transition';
	import {
		IconBrandGithub,
		IconBrandInstagram,
		IconBrandLinkedin,
		IconSend
	} from '@tabler/icons-svelte';
	import ContactReveal from '../../components/ContactReveal.svelte';
	import type { ShownState } from './contact';

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

<section class="text-gray-100 p-6 bg-custom-black h-full" in:fade={{ duration: 350 }}>
	<div class="container mx-auto relative">
		<h1 class="text-6xl font-display font-bold">Contact</h1>
		<div class="mt-6 flex flex-col gap-3">
			<p class="text-xl text-gray-200">
				Feel free to reach out and tell me about what you're working on!
			</p>
			<div class="flex flex-col gap-2 container max-w-sm">
				<ContactReveal
					shown={shownState.email}
					show={() => show('email')}
					value="hello@bencooper.xyz"
					link="mailto:hello@bencooper.xyz"
					isExternal={false}
				>
					<IconSend class="size-8 sm:size-6 flex-shrink-0" />
				</ContactReveal>
				<ContactReveal
					shown={shownState.instagram}
					show={() => show('instagram')}
					value="@ben.coo.per"
					link="https://www.instagram.com/ben.coo.per/"
				>
					<IconBrandInstagram class="size-8 sm:size-6 flex-shrink-0" />
				</ContactReveal>
				<ContactReveal
					shown={shownState.linkedin}
					show={() => show('linkedin')}
					value="ben-a-cooper"
					link="https://www.linkedin.com/in/ben-a-cooper/"
				>
					<IconBrandLinkedin class="size-8 sm:size-6 flex-shrink-0" />
				</ContactReveal>
				<ContactReveal
					shown={shownState.github}
					show={() => show('github')}
					value="ben-coo-per"
					link="https://github.com/ben-coo-per"
				>
					<IconBrandGithub class="size-8 sm:size-6 flex-shrink-0 " />
				</ContactReveal>
			</div>
		</div>
	</div>
	<p class="text-md text-gray-300 mt-4">
		🤫 If you want to see more of my work, I'll send you a link to my private portfolio.
	</p>
</section>
