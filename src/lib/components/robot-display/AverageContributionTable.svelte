<script lang="ts">
	import { Scouting } from '$lib/model/scouting';

	interface Props {
		year: number;
		scouting: Scouting.MatchScoutingExtendedArr;
	}

	const { scouting, year }: Props = $props();

	const data = $derived(scouting.averageContribution(true));
	let labelMap: Record<string, string> = $state({});

	$effect(() => {
		const res = Scouting.getYearInfo(year);
		if (res.isOk()) {
			labelMap = res.value.actions;
		} else {
			console.error(`Failed to get year info for ${year}: ${res.error}`);
		}
	});
</script>

<table class="table table-striped">
	<tbody>
		{#each Object.entries($data) as [contribution, avg]}
			<tr>
				<td>Average {labelMap[contribution]}</td>
				<td>{avg.toFixed(2)}</td>
			</tr>
		{/each}
	</tbody>
</table>
