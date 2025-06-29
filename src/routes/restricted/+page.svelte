<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Card from '../../components/Card.svelte';
	import type { Project } from '$lib/utils/sanity';

	interface Props {
		data: {
			restrictedProjects: Project[];
		};
	}

	let { data }: Props = $props();
	let passcode = $state('');
	let error = $state('');
	let isAuthenticated = $state(false);
	let isLoading = $state(false);

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
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ passcode })
			});

			const result = await response.json();

			if (result.valid) {
				isAuthenticated = true;
				// Store in session storage for page refreshes
				sessionStorage.setItem('restrictedAccess', 'true');
			} else {
				error = 'Invalid or expired passcode';
			}
		} catch (err) {
			error = 'Error verifying passcode';
		} finally {
			isLoading = false;
		}
	};

	onMount(() => {
		// Check if already authenticated in this session
		if (sessionStorage.getItem('restrictedAccess') === 'true') {
			isAuthenticated = true;
		}
	});
</script>

<svelte:head>
	<title>Restricted Projects - Ben Cooper</title>
</svelte:head>

<div class="min-h-screen bg-custom-black text-white px-4 py-8">
	<div class="container mx-auto max-w-4xl">
		<button
			onclick={() => goto('/')}
			class="mb-6 text-gray-400 hover:text-amber-300 transition-colors"
		>
			← Back to Portfolio
		</button>

		{#if !isAuthenticated}
			<div class="max-w-md mx-auto mt-20">
				<div class="text-center mb-8">
					<h1 class="text-3xl font-display font-bold mb-2">🔒 Restricted Access</h1>
					<p class="text-gray-400">Enter passcode to view confidential projects</p>
				</div>

				<form onsubmit={handleSubmit} class="space-y-4">
					<div>
						<input
							bind:value={passcode}
							type="password"
							placeholder="Enter passcode"
							class="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-amber-500 focus:outline-none text-white"
							disabled={isLoading}
						/>
					</div>

					{#if error}
						<p class="text-red-400 text-sm">{error}</p>
					{/if}

					<button
						type="submit"
						disabled={isLoading}
						class="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors font-medium"
					>
						{isLoading ? 'Verifying...' : 'Access Projects'}
					</button>
				</form>
			</div>
		{:else}
			<div>
				<div class="flex justify-between items-center mb-8">
					<h1 class="text-3xl font-display font-bold">Confidential Projects</h1>
					<button
						onclick={() => {
							sessionStorage.removeItem('restrictedAccess');
							isAuthenticated = false;
						}}
						class="text-gray-400 hover:text-red-400 transition-colors"
					>
						Lock 🔒
					</button>
				</div>

				{#if data.restrictedProjects.length > 0}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each data.restrictedProjects as project}
							<Card {project} />
						{/each}
					</div>
				{:else}
					<p class="text-gray-400 text-center py-20">No restricted projects available</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
