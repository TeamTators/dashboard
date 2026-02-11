<!--
@fileoverview Radar chart visualization for a team's keyed numeric metrics.

@component RadarChart

@description
Renders a Chart.js radar plot where each axis corresponds to a metric name and the value is the
numeric score for the current team. Optional min/max bounds can be provided for consistent scaling.

@example
```svelte
<script lang="ts">
  import RadarChart from '$lib/components/charts/RadarChart.svelte';
  import type { TBATeam } from '$lib/utils/tba';

  let team: TBATeam;
  const data = { speed: 4, defense: 2, shooting: 5 };

  let chartRef: RadarChart<typeof data> | undefined;
  const copyChart = () => chartRef?.copy(true);
</script>

<RadarChart bind:this={chartRef} {team} {data} opts={{ min: 0, max: 6 }} />
```
-->
<script lang="ts" generics="T extends Record<string, number>">
	import { onMount } from 'svelte';
	import { TBATeam } from '$lib/utils/tba';
	import Chart from 'chart.js/auto';
	import { copyCanvas } from '$lib/utils/clipboard';
	import YearInfo2025 from 'tatorscout/years/2025.js';

	/** Component props for `RadarChart`. */
	interface Props {
		/** Team whose metrics are displayed. */
		team: TBATeam;
		/** Metric values keyed by display label. */
		data: T;
		/** Optional min/max for the radial scale. */
		opts?: {
			max?: number;
			min?: number;
		};
	}

	const { team, data, opts }: Props = $props();
	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart;

	for ([keys, str] in Object.entries(YearInfo2025.actions)) {
		
	}

	/**
	 * Copy the chart canvas to the clipboard.
	 *
	 * @example
	 * ```ts
	 * chartRef.copy(true);
	 * ```
	 */
	export const copy = (notify: boolean) => copyCanvas(chartCanvas, notify);

	const render = () => {
		if (chartInstance) {
			chartInstance.destroy();
		}

		chartInstance = new Chart(chartCanvas, {
			type: 'radar',
			data: {
				labels: Object.keys(data),
				datasets: [
					{
						label: String(team.tba.team_number),
						data: Object.values(data),
						backgroundColor: 'rgba(255, 99, 132, 0.2)',
						borderColor: 'rgba(255, 99, 132, 1)'
					}
				]
			},
			options: {
				scales: {
					r: {
						min: opts?.min ?? 0,
						max: opts?.max ?? Math.max(...Object.values(data)) + 1,
						grid: {
							color: 'rgba(60, 60, 60, 1)'
						},
						angleLines: {
							color: 'rgba(60, 60, 60, 1)'
						},
						ticks: {
							color: 'rgba(102, 102, 102, 1)',
							backdropColor: 'rgba(0, 0, 0, 0)'
						}
					}
				}
			}
		});
	};

	onMount(() => {
		render();
		return () => {
			if (chartInstance) {
				chartInstance.destroy();
			}
		};
	});
</script>

<canvas bind:this={chartCanvas} style="height: 400px;"></canvas>
