<!--
@fileoverview Event-level stats table for a team.

@component EventSummary

@description
Fetches team ranking info and calculates average scoring metrics from scouting data,
then renders a summary table.

@example
```svelte
<EventSummary {team} {event} {scouting} {matches} />
```
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';
	import { Scouting } from '$lib/model/scouting';
	import { SvelteDate } from 'svelte/reactivity';

	interface Props {
		/** Team being summarized. */
		team: TBATeam;
		/** Event context used for ranking and scoring. */
		event: TBAEvent;
		/** Live scouting store for match data. */
		scouting: Scouting.MatchScoutingExtendedArr;
		/** TBA match list for endgame calculations. */
		matches: TBAMatch[];
	}

	const { team, event, scouting, matches }: Props = $props();

	let rank = $state(0);
	let record = $state('');
	let played = $state(0);
	let auto = $state(0);
	let teleop = $state(0);
	let endgame = $state(0);
	// let drivebase = $state('');
	// let weight = $state(0);
	// let averageVelocity = $state(0);
	let averageSecondsNotMoving = $state(0);

	onMount(() => {
		const d = new SvelteDate();
		d.setMinutes(d.getMinutes() + 10);
		team.getStatus(true, d).then((s) => {
			if (s.isErr()) return console.error(s.error);
			rank = s.value.qual?.ranking.rank ?? 0;
			const { wins, losses, ties } = s.value.qual?.ranking.record ?? {
				wins: 0,
				losses: 0,
				ties: 0
			};
			record = `${wins}-${losses}-${ties}`;
			played = wins + losses + ties;
		});

		return scouting.subscribe((s) => {
			const autoRes = Scouting.averageAutoScore(s, event.tba.year);
			const teleRes = Scouting.averageTeleopScore(s, event.tba.year);
			const _endRes = Scouting.averageEndgameScore(matches, team.tba.team_number, event.tba.year);
			const secondsRes = Scouting.averageSecondsNotMoving(s);

			auto = autoRes.isErr() ? 0 : autoRes.value;
			teleop = teleRes.isErr() ? 0 : teleRes.value;
			// endgame = endRes.isErr() ? 0 : endRes.value;
			averageSecondsNotMoving = secondsRes.isErr() ? 0 : secondsRes.value;
		});
	});
</script>

<div class="table-container table-responsive">
	<table class="table table-striped">
		<tbody>
			<tr>
				<td>Rank:</td>
				<td>{rank}</td>
			</tr>
			<tr>
				<td>Record:</td>
				<td>{record}</td>
			</tr>
			<tr>
				<td>Played:</td>
				<td>{played}</td>
			</tr>
			<tr>
				<td>Average Velocity:</td>
				<td class="ws-nowrap">
					{#if $scouting.length}
						{Scouting.getAverageVelocity($scouting).toFixed(2)} ft/s
					{:else}
						No data
					{/if}
				</td>
			</tr>
			<tr>
				<td>Average Auto Score:</td>
				<td>{auto.toFixed(2)}</td>
			</tr>
			<tr>
				<td>Average Teleop Score:</td>
				<td>{teleop.toFixed(2)}</td>
			</tr>
			<tr>
				<td>Average Endgame Score:</td>
				<td>{endgame.toFixed(2)}</td>
			</tr>
			<tr>
				<td>Average Seconds Not Moving:</td>
				<td>{averageSecondsNotMoving.toFixed(2)}s</td>
			</tr>
			<!-- <tr>
			<td>Drivebase:</td>
			<td>{drivebase}</td>
		</tr>
		<tr>
			<td>Weight:</td>
			<td>{weight}</td>
		</tr> -->
		</tbody>
	</table>
</div>

<style>
	.table-container {
		max-height: 100%;
		overflow-y: auto;
	}
</style>
