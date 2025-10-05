<script lang="ts">
	import TeamEventStats from '../charts/TeamEventStats.svelte';
	import Progress from '../charts/Progress.svelte';
	import { Scouting } from '$lib/model/scouting';
	import { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';
	import { DataArr } from '$lib/services/struct/data-arr';
	import { onMount } from 'svelte';

	interface Props {
		teams: TBATeam[];
		teamNumber: number;
		event: TBAEvent;
		staticY?: number;
		matches: TBAMatch[];
		scouting: Scouting.MatchScoutingArr;
	}

	let { teamNumber, teams, event, staticY = $bindable(), matches, scouting }: Props = $props();

	let team = $derived(teams.find((t) => t.tba.team_number === teamNumber));
</script>

{#if team}
	{#key scouting}
		<div class="container-fluid" style="height: 300px;">
			<div class="row h-100">
				<div class="col-md-6 h-100">
					<TeamEventStats {team} {event} bind:staticY {scouting} {matches} />
				</div>
				<div class="col-md-6 h-100">
					<Progress {team} {event} bind:staticY {scouting} {matches} />
				</div>
			</div>
		</div>
	{/key}
{/if}
