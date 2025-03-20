<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import Trace from '$lib/components/robot-display/Trace.svelte';
	import { Scouting } from '$lib/model/scouting.js';
	import { TBAEvent, TBATeam } from '$lib/utils/tba.js';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import Modal from '$lib/components/bootstrap/Modal.svelte';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import { afterNavigate } from '$app/navigation';
	import { sleep } from 'ts-utils/sleep';
	import { returnType } from 'drizzle-struct/utils';

	const { data } = $props();
	const teams = $derived(data.teams);
	const event = $derived(data.event);
	const team = $derived(data.team);
	const scoutingArr = $derived(data.scouting);

	$effect(() => nav(event.tba));

	let modal: Modal;
	let selectedScouting: Scouting.MatchScoutingData | undefined = $state(undefined);
	let scroller: HTMLDivElement;

	const open = (scouting: Scouting.MatchScoutingData) => {
		selectedScouting = scouting;
		modal.show();
	};

	const focus = writable<'auto' | 'teleop' | 'endgame' | 'all'>('all');

	afterNavigate(() => {
		const btn = scroller.querySelector(`[data-team="${team.tba.team_number}"]`);
		if (btn) {
			sleep(500).then(() =>
				btn.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest',
					inline: 'center'
				})
			);
		}
	});
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<div class="ws-nowrap scroll-x p-3 mb-3" bind:this={scroller}>
			{#each teams as t}
				<a
					type="button"
					href="/dashboard/event/{event.tba.key}/team/{t.tba.team_number}/traces"
					class="btn mx-2"
					class:btn-primary={t.tba.team_number !== team.tba.team_number}
					class:btn-outline-secondary={t.tba.team_number === team.tba.team_number}
					class:btn-disabled={t.tba.team_number === team.tba.team_number}
					class:text-muted={t.tba.team_number === team.tba.team_number}
					onclick={(e) => {
						if (t.tba.team_number === team.tba.team_number) {
							return e.preventDefault();
						}
					}}
					data-team={t.tba.team_number}
				>
					{t.tba.team_number}
				</a>
			{/each}
		</div>
	</div>
	<div class="row mb-3">
		<div class="col">
			<h1>Traces for team {team.tba.team_number} at event {event.tba.name}</h1>
			<div class="btn-group" role="group" aria-label="Trace Select">
				<input
					type="radio"
					class="btn-check"
					id="all"
					name="focus"
					autocomplete="off"
					value={$focus === 'all'}
					oninput={() => focus.set('all')}
					checked
				/>
				<label class="btn btn-outline-primary" for="all">All</label>
				<input
					type="radio"
					class="btn-check"
					id="auto"
					name="focus"
					autocomplete="off"
					value={$focus === 'auto'}
					oninput={() => focus.set('auto')}
				/>
				<label class="btn btn-outline-primary" for="auto">Auto</label>
				<input
					type="radio"
					class="btn-check"
					id="teleop"
					name="focus"
					autocomplete="off"
					value={$focus === 'teleop'}
					oninput={() => focus.set('teleop')}
				/>
				<label class="btn btn-outline-primary" for="teleop">Teleop</label>
				<input
					type="radio"
					class="btn-check"
					id="endgame"
					name="focus"
					autocomplete="off"
					value={$focus === 'endgame'}
					oninput={() => focus.set('endgame')}
				/>
				<label class="btn btn-outline-primary" for="endgame">Endgame</label>
			</div>
		</div>
	</div>
	<div class="row">
		{#key scoutingArr}
			{#if scoutingArr.length}
				{#each scoutingArr as scouting}
					<div class="col-3">
						<h3>
							{scouting.data.compLevel}{scouting.data.matchNumber} - {scouting.data.eventKey}
							<button type="button" class="btn" onclick={() => open(scouting)}>
								<i class="material-icons">visibility</i>
							</button>
						</h3>
						<Trace {scouting} {event} {focus} />
					</div>
				{/each}
			{:else}
				<p>No scouting data found for team {team.tba.team_number} at event {event.tba.name}</p>
			{/if}
		{/key}
	</div>
</div>

<Modal
	bind:this={modal}
	size="lg"
	title="Trace {selectedScouting?.data.compLevel}{selectedScouting?.data
		.matchNumber} - {selectedScouting?.data.eventKey}"
>
	{#snippet body()}
		{#key selectedScouting}
			{#if selectedScouting}
				<Trace scouting={selectedScouting} {event} {focus} />
			{:else}
				<p>No scouting data selected</p>
			{/if}
		{/key}
	{/snippet}
	{#snippet buttons()}{/snippet}
</Modal>
