<script lang="ts">
	import { Chart } from 'chart.js';
	import { onMount } from 'svelte';

	interface Props {
		datasets: {
			label: string;
			data: number[];
		}[];
		labels: string[];
	}

	const { datasets, labels }: Props = $props();

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const chart = new Chart(canvas, {
			options: {
				responsive: true,
				scales: {
					y: {
						beginAtZero: true
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

<canvas bind:this={canvas}></canvas>
