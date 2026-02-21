<script lang="ts">
	import type { Scouting } from '$lib/model/scouting';
	import type { TBATeam } from '$lib/utils/tba';
	import RadarChart from './RadarChart.svelte';

	interface Props {
		scouting: Scouting.MatchScoutingExtendedArr;
		team: TBATeam;
		year: number;
	}

	const { scouting, team, year }: Props = $props();

	// min/max
	const yearOpts: {
		[year: number]: [number, number];
	} = {
		2024: [0, 10],
		2025: [0, 10],
		2026: [0, 10]
	};

	let min = $derived(yearOpts[team.event.tba.year][0] ?? 0);
	let max = $derived(yearOpts[team.event.tba.year][1] ?? 10);
	const data = $derived(scouting.averageContribution(year, true));

	/**
	 * Copy the chart to the clipboard.
	 * @param notify Whether to show a notification after copying.
	 * @example
	 * ```ts
	 * chartRef.copy(true);
	 * ```
	 */
	export const copy = (notify: boolean) => {
		chart?.copy(notify);
	};

	let chart: RadarChart<Record<string, number>> | undefined = $state(undefined);
</script>

{#key data}
	<RadarChart
		bind:this={chart}
		{team}
		{data}
		opts={{
			min,
			max
		}}
	/>
{/key}
