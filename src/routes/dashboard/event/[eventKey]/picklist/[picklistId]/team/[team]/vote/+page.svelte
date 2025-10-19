<script lang="ts">
	import HorizontalTeamSelect from '$lib/components/FIRST/HorizontalTeamSelect.svelte';
	import { Picklist } from '$lib/model/picklist.js';
	import { TBAEvent, TBATeam } from '$lib/utils/tba.js';
	import PL from '$lib/components/picklist/Picklist.svelte';
	import nav from '$lib/imports/robot-display.js';

	const { data } = $props();

	const event = $derived(new TBAEvent(data.event));

	$effect(() => nav(event.tba));

	const teams = $derived(data.teams.map((t) => new TBATeam(t, event)));
	const picklist = $derived(Picklist.Picklist.Generator(data.picklist));
	// let picklistTeams = $state(Picklist.PicklistTeam.arr());
	// let picklistChanges = $state(Picklist.PicklistChange.arr());

	let team = $derived(teams.find((t) => data.teamNumber === t.tba.team_number));

	// onMount(() => {
	//     picklistTeams = Picklist.PicklistTeam.fromProperty('picklist', String(picklist.data.id), false);
	//     picklistChanges = Picklist.PicklistChange.fromProperty('picklist', String(picklist.data.id), false);
	// });
</script>

{#snippet str(data: unknown)}
	<span class="text-info">{data}</span>
{/snippet}

<div class="container-fluid">
	<div class="row mb-3">
		<HorizontalTeamSelect
			{teams}
			bind:selected={team}
			onSelect={(team) => {
				history.pushState(
					null,
					'',
					`/dashboard/event/${event.tba.key}/picklist/${picklist.data.id}/team/${team.tba.team_number}/vote`
				);
			}}
		/>
	</div>
	<div class="row mb-3">
		<div class="col">
			<h2>
				Voting for Team {@render str(team?.tba.team_number)} - {@render str(team?.tba.nickname)} in Picklist
				{@render str(picklist.data.name)}
			</h2>
		</div>
	</div>
	<div class="row mb-3">
		<!-- Vote here -->
	</div>
	<div class="row mb-3">
		<!-- View some summary -->
	</div>
	<div class="row mb-3">
		<PL {picklist} {teams} freeze={true} />
	</div>
</div>
