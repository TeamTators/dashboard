<script lang="ts">
	import { copyCanvas } from '$lib/utils/clipboard';
	import { Chart, registerables } from 'chart.js';
	import { onMount } from 'svelte';

	try {
		Chart.register(...registerables);
	} catch {
		//
	}

	interface Props {
		datasets: {
			label: string;
			data: number[];
		}[];
		labels: string[];
	}

	const { datasets, labels }: Props = $props();

	let canvas: HTMLCanvasElement;

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
