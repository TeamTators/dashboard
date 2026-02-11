<script lang="ts">
	import { Scouting } from '$lib/model/scouting';

	interface Props {
		year: number;
		scouting: Scouting.MatchScoutingExtendedArr;
	}

	const { scouting, year }: Props = $props();

	const data = $derived(scouting.averageContribution(year, true));

</script>

<table class="table table-striped">
	<tbody>
		{#each Object.entries($data) as [contribution, avg]}
			<tr>
				<td>Average {contribution}</td>
				<td>{avg.toFixed(2)}</td>
			</tr>
		{/each}
	</tbody>
</table>
