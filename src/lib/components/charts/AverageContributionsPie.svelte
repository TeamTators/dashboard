<!--
@fileoverview Pie chart of a team's average contributions across scoring categories.

@component AverageContributionsPie

@description
Builds a Chart.js pie chart and updates it whenever the scouting store emits new match data. The
chart shows average counts for each scoring action (levels 1-4, barge, processor).

@example
```svelte
<script lang="ts">
  import AverageContributionsPie from '$lib/components/charts/AverageContributionsPie.svelte';
  import type { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';
  import type { Scouting } from '$lib/model/scouting';

  let team: TBATeam;
  let event: TBAEvent;
  let matches: TBAMatch[] = [];
  let scouting: Scouting.MatchScoutingExtendedArr;

  let chartRef: AverageContributionsPie | undefined;
  const copyChart = () => chartRef?.copy(true);
</script>

<AverageContributionsPie bind:this={chartRef} {team} {event} {matches} {scouting} />
```
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';
	import { Scouting } from '$lib/model/scouting';
	import Chart from 'chart.js/auto';
	import { copyCanvas } from '$lib/utils/clipboard';
	import YearInfo2024 from 'tatorscout/years/2024.js';
	import YearInfo2025 from 'tatorscout/years/2025.js';
	import YearInfo2026 from 'tatorscout/years/2026.js';
	import { YearInfo } from 'tatorscout/years';
	import { Color } from 'colors/color';
	import { compliment } from '$lib/model/match-html';

	/** Component props for `AverageContributionsPie`. */
	interface Props {
		/** Team being visualized. */
		team: TBATeam;
		/** Event that provides context for matches. */
		event: TBAEvent;
		/** Live scouting store for match data. */
		scouting: Scouting.MatchScoutingExtendedArr;
		/** All TBA matches for the event. */
		matches: TBAMatch[];
	}

	const { scouting, event }: Props = $props();

	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart;

	/**
	 * Copy the chart canvas to the clipboard.
	 *
	 * @example
	 * ```ts
	 * chartRef.copy(true);
	 * ```
	 */
	export const copy = (notify: boolean) => copyCanvas(chartCanvas, notify);

	const render = (data: Record<string, number>) => {
		if (chartInstance) chartInstance.destroy();

		const labels = Object.keys(data);
		const dataset = Object.values(data);
		const colors = compliment(labels.length);

		chartInstance = new Chart(chartCanvas, {
			type: 'pie',
			data: {
				labels,
				datasets: [
					{
						label: 'Average Contributions',
						data: dataset,
						backgroundColor: colors.map((c) => c.setAlpha(0.2).toString()),
						borderColor: colors.map((c) => c.setAlpha(1).toString()),
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'right'
					}
				}
			}
		});
	};

	onMount(() => {
		render({});

		const contrib = scouting.averageContribution(event.tba.year, true, true);
		return contrib.subscribe(render);
	});
</script>

<canvas bind:this={chartCanvas} style="height: 400px;"></canvas>
