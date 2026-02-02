<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';
	import type { TBAMatch } from 'tatorscout/tba';
	import type { Scouting } from '$lib/model/scouting';

	Chart.register(BarController, BarElement, CategoryScale, LinearScale); //stuff to make the chart actually appear as a chart, i think from chart.js

	interface Props {
		scouting: Scouting.MatchScoutingExtendedArr; //takes the stuff from scouting.ts
		bins?: number;
	}

	const { scouting, bins = 20 }: Props = $props();
	
	const histogram = new Array<number>(bins).fill(0);

	let canvas: HTMLCanvasElement;
	let chart: Chart;
	//const maxVelocity = Math.max(...matches.flatMap(m => m.velocityMap()));
	//const bucketSize = maxVelocity / bins;

	// const labels = Array.from({ length: bins }, (_, i) => {
	//      const start = (i * bucketSize).toFixed(1);
	//      const end = ((i + 1) * bucketSize).toFixed(1);
	//      return `${start}–${end} fps`;
	//});

	const render = (data: {
		bins: number[];
		labels: number[];
	}) => {
		if (chart) {
			chart.destroy();
		}
  /*I think this means that when the page renders again 
  (like when you click on a new team), it will get rid of the chart and make a new one with
  the new data

  */
//this is the settings for the chart, with the labels for the graph and the bins, colors, and stuff
		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: data.labels,
				datasets: [
					{
						label: 'Velocity Histogram (Event)',
						data: data.bins,
						

						backgroundColor: 'rgba(255, 206, 86, 0.2)',
						borderColor: 'rgba(255, 206, 86, 1)',
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				scales: {
					y: { beginAtZero: true, title: { display: true, text: 'Occurrences' } }, 
					x: { title: { display: true, text: 'Velocity Range' } }
				}
			}
		});
	};

  /* when the stuff on the page loads, it renders the chart, and if there already is a chart, it gets rid of it
  so that data from other teams' data doesnt show up on the chart
  */
	onMount(() => {
		const histogramStore = scouting.velocityHistogram(bins);

		const unsubscribe = histogramStore.subscribe((data) => {
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
