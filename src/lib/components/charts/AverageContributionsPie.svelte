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

	const { scouting }: Props = $props();

	let cl1 = $state(0);
	let cl2 = $state(0);
	let cl3 = $state(0);
	let cl4 = $state(0);
	let brg = $state(0);
	let prc = $state(0);

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

	onMount(() => {
		chartInstance = new Chart(chartCanvas, {
			type: 'pie',
			data: {
				labels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Barge', 'Processor'],
				datasets: [
					{
						label: 'Average Contributions',
						data: [cl1, cl2, cl3, cl4, brg, prc],
						backgroundColor: [
							'rgba(255, 99, 132, 0.2)',
							'rgba(54, 162, 235, 0.2)',
							'rgba(255, 206, 86, 0.2)',
							'rgba(75, 192, 192, 0.2)',
							'rgba(153, 102, 255, 0.2)',
							'rgba(255, 159, 64, 0.2)',
							'rgba(199, 199, 199, 0.2)'
						],
						borderColor: [
							'rgba(255, 99, 132, 1)',
							'rgba(54, 162, 235, 1)',
							'rgba(255, 206, 86, 1)',
							'rgba(75, 192, 192, 1)',
							'rgba(153, 102, 255, 1)',
							'rgba(255, 159, 64, 1)',
							'rgba(199, 199, 199, 1)'
						],
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

		return scouting.subscribe((s) => {
			const contribution = Scouting.averageContributions(s);

			if (contribution) {
				cl1 = contribution.cl1;
				cl2 = contribution.cl2;
				cl3 = contribution.cl3;
				cl4 = contribution.cl4;
				brg = contribution.brg;
				prc = contribution.prc;

				chartInstance.data.datasets[0].data = [cl1, cl2, cl3, cl4, brg, prc];
				chartInstance.update();
			}
		});
	});
</script>

<canvas bind:this={chartCanvas} style="height: 400px;"></canvas>
