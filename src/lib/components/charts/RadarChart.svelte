<script lang="ts">
	import { onMount } from 'svelte';
	import { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';
	import { Scouting } from '$lib/model/scouting';
	import Chart from 'chart.js/auto';

	interface Props {
		team: TBATeam;
		scouting: Scouting.MatchScoutingArr;
	}

	const { team, scouting }: Props = $props();

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
			type: 'radar',
			data: {
				labels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Barge', 'Processor'],
				datasets: [
					{
						label: String(team.tba.team_number),
						data: [cl1, cl2, cl3, cl4, brg, prc],
						backgroundColor: 'rgba(255, 99, 132, 0.2)',
						borderColor: 'rgba(255, 99, 132, 1)'
					}
				]
			},
			options: {
				scales: {
					r: {
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
