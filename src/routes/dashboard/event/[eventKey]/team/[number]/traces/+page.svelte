<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import Trace from '$lib/components/robot-display/Trace.svelte';
	import { Scouting } from '$lib/model/scouting.js';
	import Modal from '$lib/components/bootstrap/Modal.svelte';
	import { writable } from 'svelte/store';
	import { afterNavigate } from '$app/navigation';
	import { sleep } from 'ts-utils/sleep';
	import MatchComments from '$lib/components/robot-display/MatchComments.svelte';
	import Checks from '$lib/components/robot-display/Checks.svelte';
	import MatchActions from '$lib/components/robot-display/MatchActions.svelte';
	import MatchContribution from '$lib/components/charts/MatchContribution.svelte';
	import type { TBAMatch } from '$lib/utils/tba.js';
	import MatchDisplay from '$lib/components/robot-display/MatchDisplay.svelte';
	import MatchDisplayNoScout from '$lib/components/robot-display/MatchDisplayNoScout.svelte';

	const { data } = $props();
	const teams = $derived(data.teams);
	const event = $derived(data.event);
	const team = $derived(data.team);
	const scoutingArr = $derived(data.scouting);
	const matches = $derived(data.matches);
	const scoutingAccounts = $derived(data.scoutingAccounts);

	$effect(() => nav(event.tba));

	let modal: Modal;
	let selectedScouting: Scouting.MatchScoutingData | undefined = $state(undefined);
	let scroller: HTMLDivElement;
	let match: TBAMatch | undefined = $state(undefined);

	const open = async (scouting: Scouting.MatchScoutingData) => {
		selectedScouting = scouting;
		match = matches.find(
			(m) =>
				m.tba.match_number === scouting.data.matchNumber &&
				m.tba.comp_level === scouting.data.compLevel
		);
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
			<div class="d-flex">
				<button onclick={() => history.back()} class="btn btn-primary me-3"> Back </button>
				<a
					href="/dashboard/event/{event.tba.key}/team/{team.tba.team_number}"
					class="btn btn-secondary"
				>
					To Robot Display
				</a>
			</div>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col">
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
				<label class="btn btn-outline-secondary" for="all">All</label>
				<input
					type="radio"
					class="btn-check"
					id="auto"
					name="focus"
					autocomplete="off"
					value={$focus === 'auto'}
					oninput={() => focus.set('auto')}
				/>
				<label class="btn btn-outline-success" for="auto">Auto</label>
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
				<label class="btn btn-outline-danger" for="endgame">Endgame</label>
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
						<Trace {scouting} {focus} />
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
			{#if match}
				{#if selectedScouting}
					<MatchDisplay
						scouting={selectedScouting}
						{team}
						{event}
						{match}
						scout={scoutingAccounts[selectedScouting.data.id || '']}
					/>
				{:else}
					You should never see this. If you do, there is a substantial bug.
					<MatchDisplayNoScout {match} {team} {event} />
				{/if}
			{:else}
				<p>Match not found</p>
			{/if}
		{/key}
	{/snippet}
	{#snippet buttons()}{/snippet}
</Modal>
