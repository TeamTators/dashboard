<!--
@component
Potato leaderboard dashboard.

Shows the top rankings and a modal with detailed potato stats.
-->
<script lang="ts">
	import { Navbar } from '$lib/model/navbar';
	import { Potato } from '$lib/model/potato';
	import { capitalize } from 'ts-utils/text';
	import Modal from '$lib/components/bootstrap/Modal.svelte';
	import Stats from '$lib/components/potato/Stats.svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import type { Account } from '$lib/model/account.js';
	const { data } = $props();
	const rankings = $derived(
		writable(
			data.rankings.sort((a, b) => Number(b.potato.data.level) - Number(a.potato.data.level))
		)
	);
	type PotatoAccount = {
		potato: Potato.FriendData;
		account?: Account.AccountData;
	};
	let first: PotatoAccount | undefined = $state(undefined);
	let second: PotatoAccount | undefined = $state(undefined);
	let third: PotatoAccount | undefined = $state(undefined);
	let rest: PotatoAccount[] = $state([]);

	const you = $derived(data.you);

	Navbar.getSections().set([]);

	Navbar.addSection({
		name: 'Potato',
		links: [
			{
				name: 'Home',
				href: '/',
				icon: {
					type: 'material-icons',
					name: 'home'
				}
			},
			{
				name: 'Logs',
				href: '/dashboard/potato/logs',
				icon: {
					type: 'material-icons',
					name: 'history'
				}
			}
		],
		priority: 0
	});

	let selectedPotato = $state(Potato.Friend.Generator({}));
	let modal: Modal;

	onMount(() => {
		const off = Potato.Friend.on('update', () => {
			rankings.update((r) => {
				r.sort((a, b) => Number(b.potato.data.level) - Number(a.potato.data.level));
				return r;
			});
		});
		const unsub = rankings.subscribe((data) => {
			first = data[0];
			second = data[1];
			third = data[2];
			rest = data.slice(3);
		});

		return () => {
			off();
			unsub();
		};
	});
</script>

{#snippet row(data: PotatoAccount, color: string)}
	<tr class:you={data.account?.data.id === you?.account?.data.id}>
		<td>
			<button
				type="button"
				class="btn"
				onclick={() => {
					selectedPotato = data.potato;
					modal.show();
				}}
			>
				<img
					src="/potato/{data.potato.data.icon
						? data.potato.data.icon
						: Potato.getPhase(data.potato.data.level || 0)}.png"
					alt={Potato.getPhase(data.potato.data.level || 0)}
					srcset=""
					style="width: 56px; height: 56px;"
					title={capitalize(Potato.getPhase(data.potato.data.level || 0))}
				/>
			</button>
		</td>
		<td class="text-{color}"
			>{data.account?.data.username}
			{#if data.account?.data.username === you?.account?.data.username}
				<span class="badge bg-primary">You</span>
			{/if}
		</td>
		<td class="text-{color}">{data.potato.data.name}</td>
		<td class="text-{color}">{data.potato.data.level}</td>
	</tr>
{/snippet}

<div class="container">
	<div class="row mb-3 pt-3">
		<div class="col">
			<h1>Potato Leaderboard</h1>
			<p class="text-muted">
				The way to gain levels for your potato is to contribute to scouting.
				<br />
				&nbsp; Match scouting: 15 levels
				<br />
				&nbsp; Prescouting: additional 5 levels
				<br />
				&nbsp; Remote Scouting: additional 5 levels
				<br />
				&nbsp; Pit Scouting: 3 levels per question answered
				<br />
				&nbsp; Taking Team Pictures: 5 levels
			</p>
			<button type="button" class="btn btn-primary" onclick={() => window.history.back()}>
				<i class="material-icons">arrow_back</i> Go Back
			</button>
		</div>
	</div>
	<div class="row mb-3">
		<div class="table-responsive">
			<table class="table table-striped">
				<tbody>
					<tr>
						<td colspan="4" class="text-muted text-center">
							<h4>Top 3</h4>
						</td>
					</tr>
					{#if first}
						{@render row(first, 'success')}
					{/if}
					{#if second}
						{@render row(second, 'info')}
					{/if}
					{#if third}
						{@render row(third, 'warning')}
					{/if}
					{#if rest.length}
						<tr>
							<td colspan="4" class="text-muted text-center">
								<h4>Growing Potatoes</h4>
							</td>
						</tr>
						{#each rest as r}
							{@render row(r, 'light')}
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<Modal bind:this={modal} title={$selectedPotato.name || 'Potato'} size="md">
	{#snippet body()}
		{#key selectedPotato}
			<div class="d-flex justify-content-center">
				<img
					src="/potato/{selectedPotato.data.icon
						? selectedPotato.data.icon
						: Potato.getPhase(selectedPotato.data.level || 0)}.png"
					alt={Potato.getPhase(selectedPotato.data.level || 0)}
					srcset=""
					style="width: 128px; height: 128px;"
					title={capitalize(Potato.getPhase(selectedPotato.data.level || 0))}
				/>
			</div>
			<Stats potato={selectedPotato} />
		{/key}
	{/snippet}

	{#snippet buttons()}{/snippet}
</Modal>

<style>
	.you * {
		background-color: #f0f0f0 !important;
		color: black !important;
	}
</style>
