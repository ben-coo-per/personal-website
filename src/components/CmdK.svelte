<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { cmdkOpen } from '$lib/stores/ui';
	import type { ProjectMetadata } from '$lib/types';

	interface Props {
		projects?: ProjectMetadata[];
	}

	let { projects = [] }: Props = $props();

	let isOpen = $state(false);
	let query = $state('');
	let selected = $state(0);
	let showPassword = $state(false);
	let passcode = $state('');
	let pwStatus: 'idle' | 'err' | 'ok' = $state('idle');
	let pwMsg = $state('enter the passcode you were given.');
	let searchInput: HTMLInputElement = $state()!;
	let pwInput: HTMLInputElement = $state()!;
	let listEl: HTMLElement = $state()!;
	let usingKeyboard = $state(false);

	// Sync with store
	$effect(() => {
		const unsub = cmdkOpen.subscribe((v) => {
			if (v && !isOpen) openPalette();
			else if (!v && isOpen) closePalette();
		});
		return unsub;
	});

	type Item = {
		id: string;
		group: 'actions' | 'jump' | 'projects' | 'social';
		icon: string;
		label: string;
		meta?: string;
		action: () => void;
	};

	type JumpRoute = {
		id: string;
		path: string;
		icon: string;
		label: string;
	};

	const baseItems: Item[] = [
		{
			id: 'unlock',
			group: 'actions',
			icon: '🔒',
			label: 'Unlock confidential projects',
			meta: 'passcode',
			action: () => triggerPasswordEntry()
		},
		{
			id: 'email',
			group: 'actions',
			icon: '✉',
			label: 'Copy email',
			meta: 'hello@bencooper.xyz',
			action: () => {
				navigator.clipboard?.writeText('hello@bencooper.xyz');
				toast('email copied');
				closePalette();
			}
		},
		{
			id: 'gh',
			group: 'social',
			icon: '◉',
			label: 'GitHub',
			meta: 'ben-coo-per',
			action: () => {
				window.open('https://github.com/ben-coo-per', '_blank');
			}
		},
		{
			id: 'ig',
			group: 'social',
			icon: '◉',
			label: 'Instagram',
			meta: 'ben.coo.per',
			action: () => {
				window.open('https://instagram.com/ben.coo.per', '_blank');
			}
		},
		{
			id: 'li',
			group: 'social',
			icon: '◉',
			label: 'LinkedIn',
			meta: 'ben-coo-per',
			action: () => {
				window.open('https://linkedin.com/in/ben-coo-per', '_blank');
			}
		}
	];

	const jumpRoutes: JumpRoute[] = [
		{ id: 'projects', path: '/projects', icon: '/', label: 'projects' },
		{ id: 'about', path: '/about', icon: '◌', label: 'about' },
		{ id: 'storehouse', path: '/storehouse', icon: '▦', label: 'storehouse' }
	];

	const GROUP_ORDER = ['actions', 'jump', 'social', 'projects'] as const;
	const GROUP_LABELS: Record<string, string> = {
		actions: 'actions',
		jump: 'jump to',
		projects: 'projects',
		social: 'social'
	};

	const projectItems = $derived(
		projects.map(
			(p): Item => ({
				id: 'p-' + p.slug,
				group: 'projects',
				icon: '●',
				label: p.title ?? p.slug,
				meta: (p.date?.getFullYear() ?? '') + (p.subtitle ? ' · ' + p.subtitle : ''),
				action: () => {
					window.location.href = '/projects/' + p.slug;
				}
			})
		)
	);

	const jumpItems = $derived(
		jumpRoutes
			.filter((route) => {
				const pathname = $page.url.pathname;
				return pathname !== route.path && !pathname.startsWith(route.path + '/');
			})
			.map(
				(route): Item => ({
					id: route.id,
					group: 'jump',
					icon: route.icon,
					label: route.label,
					meta: '',
					action: () => {
						window.location.href = route.path;
					}
				})
			)
	);

	const allItems = $derived(
		GROUP_ORDER.flatMap((g) =>
			g === 'projects'
				? projectItems
				: g === 'jump'
					? jumpItems
					: baseItems.filter((i) => i.group === g)
		)
	);

	const filtered = $derived(() => {
		const q = query.trim().toLowerCase();
		if (!q) return allItems;
		return allItems.filter((it) =>
			(it.label + ' ' + (it.meta ?? '') + ' ' + it.group).toLowerCase().includes(q)
		);
	});

	function openPalette() {
		isOpen = true;
		cmdkOpen.set(true);
		query = '';
		selected = 0;
		showPassword = false;
		pwStatus = 'idle';
		passcode = '';
		setTimeout(() => searchInput?.focus(), 20);
	}

	function closePalette() {
		isOpen = false;
		cmdkOpen.set(false);
		showPassword = false;
	}

	function triggerPasswordEntry() {
		showPassword = true;
		pwStatus = 'idle';
		pwMsg = 'enter the passcode you were given.';
		setTimeout(() => pwInput?.focus(), 20);
	}

	async function submitPassword() {
		const val = passcode.trim();
		if (!val) return;
		try {
			const res = await fetch('/api/verify-passcode', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ passcode: val })
			});
			const result = await res.json();
			if (result.valid) {
				await fetch('/api/set-restricted-access', { method: 'POST' });
				pwStatus = 'ok';
				pwMsg = 'unlocked · reloading…';
				setTimeout(() => {
					closePalette();
					window.location.reload();
				}, 450);
			} else {
				pwStatus = 'err';
				pwMsg = 'nope. try again.';
				passcode = '';
				pwInput?.focus();
			}
		} catch {
			pwStatus = 'err';
			pwMsg = 'error verifying passcode.';
		}
	}

	function selectItem(item: Item) {
		item.action();
	}

	function handleKeydown(e: KeyboardEvent) {
		usingKeyboard = true;
		const items = filtered();
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selected = Math.min(items.length - 1, selected + 1);
			scrollSelected();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selected = Math.max(0, selected - 1);
			scrollSelected();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const item = items[selected];
			if (item) selectItem(item);
		}
	}

	function scrollSelected() {
		setTimeout(() => {
			listEl?.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
		}, 0);
	}

	function toast(msg: string) {
		const t = document.createElement('div');
		t.textContent = msg;
		t.style.cssText =
			'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);z-index:200;' +
			'background:#141419;color:#f5f2eb;font-family:var(--font-mono);font-size:12px;' +
			'padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);' +
			'box-shadow:0 10px 30px rgba(0,0,0,.5);transition:opacity 0.4s;';
		document.body.appendChild(t);
		setTimeout(() => {
			t.style.opacity = '0';
		}, 1800);
		setTimeout(() => t.remove(), 2200);
	}

	onMount(() => {
		function onKey(e: KeyboardEvent) {
			const inField =
				e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
			if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				isOpen ? closePalette() : openPalette();
			} else if (e.key === 'Escape' && isOpen) {
				closePalette();
			} else if (e.key === '/' && !inField && !isOpen) {
				e.preventDefault();
				openPalette();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function groupedFiltered() {
		const items = filtered();
		const groups: Record<string, (Item & { globalIdx: number })[]> = {};
		items.forEach((item, i) => {
			(groups[item.group] ??= []).push({ ...item, globalIdx: i });
		});
		return GROUP_ORDER.filter((g) => groups[g]?.length).map((g) => ({
			key: g,
			label: GROUP_LABELS[g],
			items: groups[g]
		}));
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="scrim"
		onclick={(e) => {
			if (e.target === e.currentTarget) closePalette();
		}}
		role="dialog"
		aria-modal="true"
		aria-label="Command palette"
	>
		<div class="cmdk">
			<div class="cmdk-search">
				<span class="prompt">❯</span>
				<input
					bind:this={searchInput}
					bind:value={query}
					onkeydown={handleKeydown}
					oninput={() => {
						selected = 0;
					}}
					type="text"
					placeholder="search projects, jump to a page, copy email…"
					autocomplete="off"
				/>
				<span class="esc">esc</span>
			</div>

			<div
				class="cmdk-list"
				bind:this={listEl}
				onpointermove={() => {
					usingKeyboard = false;
				}}
			>
				{#if filtered().length === 0}
					<div class="cmdk-empty">
						no matches. try "email", "unlock", "storehouse", or a project name.
					</div>
				{:else}
					{#each groupedFiltered() as group}
						<div class="cmdk-grp">
							<div class="cmdk-grp-title">{group.label}</div>
							{#each group.items as item}
								<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
								<div
									class="cmdk-opt"
									class:sel={item.globalIdx === selected}
									onclick={() => selectItem(item)}
									onmouseenter={() => {
										if (!usingKeyboard) selected = item.globalIdx;
									}}
									role="option"
									aria-selected={item.globalIdx === selected}
									tabindex="0"
								>
									<span class="icon">{item.icon}</span>
									<span class="lbl"
										>{item.label}
										{#if item.meta}<span class="meta">{item.meta}</span>{/if}</span
									>
									<span class="kbdkey">↵</span>
								</div>
							{/each}
						</div>
					{/each}
				{/if}
			</div>

			{#if showPassword}
				<div class="cmdk-pw" class:err={pwStatus === 'err'} class:ok={pwStatus === 'ok'}>
					<input
						bind:this={pwInput}
						bind:value={passcode}
						onkeydown={(e) => {
							if (e.key === 'Enter') submitPassword();
						}}
						type="password"
						placeholder="passcode"
						autocomplete="off"
					/>
					<button onclick={submitPassword}>unlock</button>
					<span class="msg">{pwMsg}</span>
				</div>
			{/if}

			<div class="cmdk-foot">
				<span>↑↓ navigate</span>
				<span>↵ select</span>
				<span>esc close</span>
				<span class="sp">⌘K anywhere</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding-top: 14vh;
	}

	.cmdk {
		width: min(560px, 92vw);
		background: #141419;
		border: 1px solid var(--rule-2);
		border-radius: 12px;
		color: var(--ink);
		font-size: 13.5px;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.7),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
		overflow: hidden;
		animation: slideIn 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	@keyframes slideIn {
		from {
			transform: translateY(-10px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.cmdk-search {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
		border-bottom: 1px solid var(--rule);
	}

	.prompt {
		color: var(--amber);
		font-family: var(--font-mono);
		font-size: 13px;
	}

	.cmdk-search input {
		all: unset;
		flex: 1;
		color: var(--ink);
		caret-color: var(--amber);
		font-family: inherit;
		font-size: 14px;
	}

	.cmdk-search input::placeholder {
		color: var(--ink-3);
	}

	.esc {
		font-family: var(--font-mono);
		font-size: 10.5px;
		border: 1px solid var(--rule-2);
		padding: 2px 6px;
		border-radius: 4px;
		color: var(--ink-3);
	}

	.cmdk-list {
		max-height: 360px;
		overflow-y: auto;
		padding: 6px 0;
	}

	.cmdk-grp {
		padding: 8px 0;
	}

	.cmdk-grp-title {
		padding: 4px 16px;
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.08em;
		color: var(--ink-3);
		text-transform: uppercase;
	}

	.cmdk-opt {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 9px 16px;
		cursor: pointer;
		border-left: 2px solid transparent;
		transition: background 0.1s;
	}

	.cmdk-opt:hover,
	.cmdk-opt.sel {
		background: rgba(251, 191, 36, 0.08);
		border-left-color: var(--amber);
	}

	.cmdk-opt.sel .icon {
		color: var(--amber);
	}

	.icon {
		width: 18px;
		text-align: center;
		color: var(--ink-2);
		font-family: var(--font-mono);
		font-size: 13px;
	}

	.lbl {
		flex: 1;
	}

	.meta {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--ink-3);
		margin-left: 6px;
	}

	.kbdkey {
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: var(--ink-3);
		border: 1px solid var(--rule-2);
		padding: 1px 6px;
		border-radius: 4px;
	}

	.cmdk-empty {
		padding: 24px 16px;
		color: var(--ink-3);
		text-align: center;
		font-family: var(--font-mono);
		font-size: 12px;
	}

	.cmdk-foot {
		display: flex;
		gap: 14px;
		padding: 8px 16px;
		border-top: 1px solid var(--rule);
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: var(--ink-3);
		letter-spacing: 0.02em;
	}

	.sp {
		margin-left: auto;
	}

	.cmdk-pw {
		display: flex;
		padding: 14px 16px;
		border-top: 1px solid var(--rule);
		gap: 10px;
		align-items: center;
	}

	.cmdk-pw input {
		all: unset;
		flex: 1;
		padding: 8px 10px;
		background: #0d0d12;
		border: 1px solid var(--rule-2);
		border-radius: 6px;
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--ink);
		caret-color: var(--amber);
	}

	.cmdk-pw input:focus {
		border-color: var(--amber);
	}

	.cmdk-pw button {
		padding: 8px 14px;
		background: var(--amber);
		color: #0a0a0b;
		font-weight: 600;
		border-radius: 6px;
		font-family: var(--font-mono);
		font-size: 12px;
	}

	.cmdk-pw .msg {
		font-family: var(--font-mono);
		font-size: 11.5px;
		color: var(--ink-3);
	}

	.cmdk-pw.err .msg {
		color: #ff6161;
	}

	.cmdk-pw.ok .msg {
		color: var(--green-status);
	}
</style>
