<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let title: string = 'Some projects are confidential';
	export let label: string = 'Enter passcode to continue';

	let passcode = '';
	let error = '';
	let isLoading = false;

	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		if (!passcode.trim()) {
			error = 'Please enter a passcode';
			return;
		}
		isLoading = true;
		error = '';
		try {
			const response = await fetch('/api/verify-passcode', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ passcode })
			});
			const result = await response.json();
			if (result.valid) {
				dispatch('success');
				passcode = '';
			} else {
				error = 'Invalid or expired passcode';
			}
		} catch (err) {
			error = 'Error verifying passcode';
		} finally {
			isLoading = false;
		}
	};
</script>

<div class="w-full max-w-sm mx-auto p-2 bg-custom-black border border-gray-700 rounded-lg">
	<p class="block text-gray-300 mb-1 text-lg">{title}</p>
	<form on:submit={handleSubmit} class="space-y-2">
		<label for="password" class="block text-sm text-gray-300 mb-1">{label}</label>
		<input
			bind:value={passcode}
			id="password"
			type="password"
			placeholder="Passcode"
			class="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded focus:border-amber-500 focus:outline-none text-gray-400"
			disabled={isLoading}
		/>
		{#if error}
			<p class="text-red-400 text-sm">{error}</p>
		{/if}
		<button
			type="submit"
			disabled={isLoading || !passcode.trim()}
			class="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white py-1 px-4 rounded transition-colors font-medium"
		>
			{isLoading ? 'Verifying...' : 'Submit'}
		</button>
	</form>
</div>
