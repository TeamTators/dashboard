<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';
	import type { TBAMatch } from 'tatorscout/tba';
	import type { Scouting } from '$lib/model/scouting';
	// required for this chart
	Chart.register(BarController, BarElement, CategoryScale, LinearScale);

	interface Props {
		scouting: Scouting.MatchScoutingExtendedArr;
		bins?: number;
	}

	const { scouting, bins = 20 }: Props = $props();

	const histogram = 'DO SOMETHING HERE';

	let canvas: HTMLCanvasElement;
	let chart: Chart;
	//const maxVelocity = Math.max(...matches.flatMap(m => m.velocityMap()));
	//const bucketSize = maxVelocity / bins;

	// const labels = Array.from({ length: bins }, (_, i) => {
	//      const start = (i * bucketSize).toFixed(1);
	//      const end = ((i + 1) * bucketSize).toFixed(1);
	//      return `${start}–${end} fps`;
	//});

	const render = (data: { bins: number[]; labels: number[] }) => {
		if (chart) {
			chart.destroy();
		}
		/*I think this means that when the page renders again 
			(like when you click on a new team), it will get rid of the chart and make a new one with
			the new data
  		*/

		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: data.labels,
				datasets: [
					{
						label: 'Velocity Histogram Occurences in Feet/Second',
						data: data.bins,
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				scales: {
					y: {
						beginAtZero: true,
						title: { display: true, text: 'Velocity Histogram Occurences in Feet/Second' }
					},
					x: { title: { display: true, text: 'Velocity Range' } }
				}
			}
		});
	};
	onMount(() => {
		const histogramStore = scouting.velocityHistogram(bins);

		const unsubscribe = histogramStore.subscribe((data) => {
			// when a new match is created, rerender
			render({
				bins: data.bins,
				labels: data.labels
			});
		});

		return () => {
			unsubscribe();
			if (chart) chart.destroy();
		};
	});
</script>

<canvas bind:this={canvas}></canvas>
