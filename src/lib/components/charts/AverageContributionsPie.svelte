<script lang="ts">
	import { onMount } from 'svelte';
	import { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';
	import { DataArr } from 'drizzle-struct/front-end';
	import { Scouting } from '$lib/model/scouting';
	import Chart from 'chart.js/auto';

	interface Props {
		team: TBATeam;
		event: TBAEvent;
		scouting: Scouting.MatchScoutingArr;
		matches: TBAMatch[];
	}

	const { team, event, scouting, matches }: Props = $props();

	let cl1 = $state(0);
	let cl2 = $state(0);
	let cl3 = $state(0);
	let cl4 = $state(0);
	let brg = $state(0);
	let prc = $state(0);

	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart;

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
