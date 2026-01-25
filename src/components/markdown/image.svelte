<script lang="ts">
	interface Props {
		href?: string;
		title?: string;
		text?: string;
	}

	let { href = '', title = undefined, text = '' }: Props = $props();
</script>

<img src={href} {title} alt={text} class="rounded-lg shadow-xl" />
