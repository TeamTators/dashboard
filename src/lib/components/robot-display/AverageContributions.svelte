<script lang="ts">
	import { onMount } from 'svelte';
	import { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';
	import { DataArr } from 'drizzle-struct/front-end';
	import { Scouting } from '$lib/model/scouting';

	interface Props {
		team: TBATeam;
		event: TBAEvent;
		scouting: Scouting.MatchScoutingArr;
		matches: TBAMatch[];
	}

	const { team, event, scouting, matches }: Props = $props();

	let cl1 = $state(0);
	let cl2 = $state(0);
	let cl3 = $state(0);
	let cl4 = $state(0);
	let overall = $state(0);
	let brg = $state(0);
	let prc = $state(0);

	onMount(() => {
		return scouting.subscribe((s) => {
			const contribution = Scouting.averageContributions(s);

			if (contribution) {
				cl1 = contribution.cl1;
				cl2 = contribution.cl2;
				cl3 = contribution.cl3;
				cl4 = contribution.cl4;
				overall = cl1 + cl2 + cl3 + cl4;
				brg = contribution.brg;
				prc = contribution.prc;
			}
		});
	});
</script>

<table class="table">
	<tbody>
		<tr>
			<td>Average Overall Coral:</td>
			<td>{overall.toFixed(1)}</td>
		</tr>
		<tr>
			<td>Average Level 1:</td>
			<td>{cl1.toFixed(1)}</td>
		</tr>
		<tr>
			<td>Average Level 2:</td>
			<td>{cl2.toFixed(1)}</td>
		</tr>
		<tr>
			<td>Average Level 3:</td>
			<td>{cl3.toFixed(1)}</td>
		</tr>
		<tr>
			<td>Average Level 4:</td>
			<td>{cl4.toFixed(1)}</td>
		</tr>
		<tr>
			<td>Average Barge:</td>
			<td>{brg.toFixed(1)}</td>
		</tr>
		<tr>
			<td>Average Processor:</td>
			<td>{prc.toFixed(1)}</td>
		</tr>
	</tbody>
</table>
