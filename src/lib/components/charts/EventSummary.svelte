<!--
@fileoverview Generic event summary bar chart component (Chart.js).

@component EventSummary

@description
Renders a responsive bar chart using provided datasets and labels. Intended for event-level
summary metrics where each dataset corresponds to a scoring/metric series.

@example
```svelte
<script lang="ts">
	import EventSummary from '$lib/components/charts/EventSummary.svelte';

	const labels = ['Q1', 'Q2', 'Q3'];
	const datasets = [{ label: 'Score', data: [10, 12, 9] }];

	let chartRef: EventSummary | undefined;
	const copyChart = () => chartRef?.copy(true);
</script>

<EventSummary bind:this={chartRef} {labels} {datasets} />
```
-->
<script lang="ts">
	import { copyCanvas } from '$lib/utils/clipboard';
	import { Chart, registerables } from 'chart.js';
	import { onMount } from 'svelte';

	try {
		Chart.register(...registerables);
	} catch {
		//
	}

	/** Component props for `EventSummary`. */
	interface Props {
		/** Series definitions for the bar chart. */
		datasets: {
			label: string;
			data: number[];
		}[];
		/** Category labels on the x-axis. */
		labels: string[];
	}

	const { datasets, labels }: Props = $props();

	let canvas: HTMLCanvasElement;

	/**
	 * Copy the chart canvas to the clipboard.
	 *
	 * @example
	 * ```ts
	 * chartRef.copy(true);
	 * ```
	 */
	export const copy = (notify: boolean) => copyCanvas(canvas, notify);

	onMount(() => {
		new Chart(canvas, {
			options: {
				responsive: true,
				scales: {
					y: {
						beginAtZero: true
					},
					x: {
						ticks: {
							autoSkip: false,
							maxRotation: 90,
							minRotation: 0
						}
					}
				},
				maintainAspectRatio: false
			},
			data: {
				datasets,
				labels
			},
			type: 'bar'
		});
	});
</script>

<canvas bind:this={canvas} style="width: 100%; height: 100%;"></canvas>
