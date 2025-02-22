<script lang="ts">
	import {
		IconBrandGithub,
		IconBrandInstagram,
		IconBrandLinkedin,
		IconSend
	} from '@tabler/icons-svelte';
	import ContactReveal from './ContactReveal.svelte';
</script>

<div class="flex flex-col gap-2 md:gap-0 text-gray-200">
	<ContactReveal value="@ben.coo.per" link="https://www.instagram.com/ben.coo.per/">
		<IconBrandInstagram class="size-8 sm:size-4 flex-shrink-0" />
	</ContactReveal>
	<ContactReveal value="ben-a-cooper" link="https://www.linkedin.com/in/ben-a-cooper/">
		<IconBrandLinkedin class="size-8 sm:size-4 flex-shrink-0" />
	</ContactReveal>
	<ContactReveal value="ben-coo-per" link="https://github.com/ben-coo-per">
		<IconBrandGithub class="size-8 sm:size-4 flex-shrink-0 " />
	</ContactReveal>
	<ContactReveal value="hello@bencooper.xyz" link="mailto:hello@bencooper.xyz" isExternal={false}>
		<IconSend class="size-8 sm:size-4 flex-shrink-0" />
	</ContactReveal>
</div>
