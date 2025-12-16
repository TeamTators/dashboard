<script lang="ts">
	import Modal from '$lib/components/bootstrap/Modal.svelte';
	import MatchContribution from '$lib/components/charts/MatchContribution.svelte';
	import Checks from '$lib/components/robot-display/Checks.svelte';
	import MatchActions from '$lib/components/robot-display/MatchActions.svelte';
	import MatchComments from '$lib/components/robot-display/MatchComments.svelte';
	import Trace from '$lib/components/robot-display/Trace.svelte';
	import { Scouting } from '$lib/model/scouting.js';
	import { listen } from '$lib/utils/struct-listener';
	import type { TBAEvent, TBAMatch } from '$lib/utils/tba.js';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	const { data } = $props();

	const year = $derived(data.year);
	const teamNumber = $derived(data.teamNumber);
	const scouting = $derived(data.scouting);
	let scoutingArr = $state(new Scouting.MatchScoutingExtendedArr([]));
	const team = $derived(data.team);
	const events = $derived(data.events);

	const focus = writable<'auto' | 'teleop' | 'endgame' | 'all'>('all');
	onMount(() => {
		const res = Scouting.MatchScoutingExtendedArr.fromArr(scouting);
		if (res.isOk()) {
			scoutingArr = res.value;
		} else {
			console.error('Error creating MatchScoutingExtendedArr:', res.error);
		}

		return listen(scouting, (data) => {
			return data.data.year === year && data.data.team === teamNumber;
		});
	});

	let modal: Modal;

	let selectedScouting: Scouting.MatchScoutingExtended | undefined = $state(undefined);
	let match: TBAMatch | undefined = $state(undefined);
	let event: TBAEvent | undefined = $state(undefined);

	const open = async (scouting: Scouting.MatchScoutingExtended) => {
		selectedScouting = scouting;
		const e = events.find((e) => e.event.tba.key === scouting.eventKey);
		event = e?.event;
		match = e?.matches.find(
			(m) => m.tba.match_number === scouting.matchNumber && m.tba.comp_level === scouting.compLevel
		);
		modal.show();
	};
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<div class="col">
			<h1>Prescouting for team {teamNumber} for year {year}</h1>
			<div class="d-flex">
				<button onclick={() => history.back()} class="btn btn-primary me-3"> Back </button>
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
		{#key scouting}
			{#if $scouting.length}
				{#each $scoutingArr as scouting}
					<div class="col-3">
						<h3>
							{scouting.compLevel}{scouting.matchNumber} - {scouting.eventKey}
							<button type="button" class="btn" onclick={() => open(scouting)}>
								<i class="material-icons">visibility</i>
							</button>
						</h3>
						<Trace {scouting} {focus} />
					</div>
				{/each}
			{:else}
				<p>No scouting data found for team {teamNumber} for year {year}</p>
			{/if}
		{/key}
	</div>
</div>
<Modal
	bind:this={modal}
	size="lg"
	title="Trace {selectedScouting?.compLevel}{selectedScouting?.matchNumber} - {selectedScouting?.eventKey}"
>
	{#snippet body()}
		{#key selectedScouting}
			{#if selectedScouting}
				<div class="container">
					<div class="row mb-3">
						<Trace scouting={selectedScouting} {focus} />
					</div>
					<div class="row mb-3">
						{#if match && event}
							<MatchContribution {match} scouting={selectedScouting} {team} {event} />
						{/if}
					</div>
					<div class="row mb-3">
						<MatchComments scouting={selectedScouting} />
					</div>
					<div class="row mb-2">
						<div class="col-md-6">
							<Checks scouting={selectedScouting} />
						</div>
						<div class="col-md-6">
							<MatchActions scouting={selectedScouting} />
						</div>
					</div>
				</div>
			{:else}
				<p>No scouting data selected</p>
			{/if}
		{/key}
	{/snippet}
	{#snippet buttons()}{/snippet}
</Modal>
