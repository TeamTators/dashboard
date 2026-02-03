<!--
@fileoverview Strategy team comparison charts for an event.

@component TeamDisplay

@description
Renders team event stats and progress charts side-by-side for the selected team number.

@example
```svelte
<TeamDisplay {teams} teamNumber={1234} {event} {matches} {scouting} />
```
-->
<script lang="ts">
	import TeamEventStats from '../charts/TeamEventStats.svelte';
	import Progress from '../charts/Progress.svelte';
	import { Scouting } from '$lib/model/scouting';
	import { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';

	interface Props {
		/** All teams available for lookup. */
		teams: TBATeam[];
		/** Selected team number. */
		teamNumber: number;
		/** Event context for charts. */
		event: TBAEvent;
		/** Optional fixed Y range shared between charts. */
		staticY?: number;
		/** Match list for event context. */
		matches: TBAMatch[];
		/** Scouting data for the event. */
		scouting: Scouting.MatchScoutingExtendedArr;
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
