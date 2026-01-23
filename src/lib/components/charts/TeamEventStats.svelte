<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';
	import { Chart } from 'chart.js';
	import { onMount } from 'svelte';
	import { Trace, type P } from 'tatorscout/trace';
	import { copyCanvas } from '$lib/utils/clipboard';

	interface Props {
		team: TBATeam;
		event: TBAEvent;
		staticY?: number;
		scouting: Scouting.MatchScoutingExtendedArr;
		matches: TBAMatch[];
	}

	let { team, staticY = $bindable(), scouting }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart;

	export const copy = (notify: boolean) => copyCanvas(canvas, notify);

	onMount(() => {
		scouting.sort((a, b) => {
			if (a.compLevel === b.compLevel) return Number(a.matchNumber) - Number(b.matchNumber);
			const order = ['qm', 'qf', 'sf', 'f'];
			return order.indexOf(String(a.compLevel)) - order.indexOf(String(b.compLevel));
		});

		return scouting.subscribe(async (data) => {
			if (chart) chart.destroy();
			try {
				const counts = data.map((s) => {
					const sectionCounts = s.trace.points.reduce(
						(acc, curr) => {
							if (!curr[3]) return acc;
							const section = Trace.getSection(curr as P);
							if (!section) {
								return acc;
							}
							if (!acc[section]) acc[section] = {};
							acc[section][curr[3] as string] = (acc[section][curr[3] as string] || 0) + 1;
							return acc;
						},
						{ auto: {}, teleop: {}, endgame: {} } as Record<
							'auto' | 'teleop' | 'endgame',
							Record<string, number>
						>
					);

					return {
						autoCounts: sectionCounts.auto,
						teleopCounts: sectionCounts.teleop,
						endgameCounts: sectionCounts.endgame
					};
				});

				const calculateAverage = (numbers: number[]) => {
					return numbers.reduce((acc, n) => acc + n, 0) / numbers.length;
				};

				const chartColors = [
					'rgba(255, 99, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)',
					'rgba(153, 102, 255, 0.2)',
					'rgba(255, 159, 64, 0.2)',
					'rgba(201, 203, 207, 0.2)',
					'rgba(100, 149, 237, 0.2)',
					'rgba(255, 215, 0, 0.2)'
				];

				const chartBorderColors = [
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)',
					'rgba(153, 102, 255, 1)',
					'rgba(255, 159, 64, 1)',
					'rgba(201, 203, 207, 1)',
					'rgba(100, 149, 237, 1)',
					'rgba(255, 215, 0, 1)'
				];

				const actionDatasets = [
					{
						label: 'Level 1',
						data: [
							Math.min(...counts.map((c) => c.autoCounts.cl1 || 0)),
							calculateAverage(counts.map((c) => c.autoCounts.cl1 || 0)),
							Math.max(...counts.map((c) => c.autoCounts.cl1 || 0)),
							Math.min(...counts.map((c) => c.teleopCounts.cl1 || 0)),
							calculateAverage(counts.map((c) => c.teleopCounts.cl1 || 0)),
							Math.max(...counts.map((c) => c.teleopCounts.cl1 || 0)),
							0,
							0,
							0,
							Math.min(...counts.map((c) => (c.autoCounts.cl1 || 0) + (c.teleopCounts.cl1 || 0))),
							calculateAverage(
								counts.map((c) => (c.autoCounts.cl1 || 0) + (c.teleopCounts.cl1 || 0))
							),
							Math.max(...counts.map((c) => (c.autoCounts.cl1 || 0) + (c.teleopCounts.cl1 || 0)))
						],
						backgroundColor: chartColors[0],
						borderColor: chartBorderColors[0],
						borderWidth: 1
					},
					{
						label: 'Level 2',
						data: [
							Math.min(...counts.map((c) => c.autoCounts.cl2 || 0)),
							calculateAverage(counts.map((c) => c.autoCounts.cl2 || 0)),
							Math.max(...counts.map((c) => c.autoCounts.cl2 || 0)),
							Math.min(...counts.map((c) => c.teleopCounts.cl2 || 0)),
							calculateAverage(counts.map((c) => c.teleopCounts.cl2 || 0)),
							Math.max(...counts.map((c) => c.teleopCounts.cl2 || 0)),
							0,
							0,
							0,
							Math.min(...counts.map((c) => (c.autoCounts.cl2 || 0) + (c.teleopCounts.cl2 || 0))),
							calculateAverage(
								counts.map((c) => (c.autoCounts.cl2 || 0) + (c.teleopCounts.cl2 || 0))
							),
							Math.max(...counts.map((c) => (c.autoCounts.cl2 || 0) + (c.teleopCounts.cl2 || 0)))
						],
						backgroundColor: chartColors[1],
						borderColor: chartBorderColors[1],
						borderWidth: 1
					},
					{
						label: 'Level 3',
						data: [
							Math.min(...counts.map((c) => c.autoCounts.cl3 || 0)),
							calculateAverage(counts.map((c) => c.autoCounts.cl3 || 0)),
							Math.max(...counts.map((c) => c.autoCounts.cl3 || 0)),
							Math.min(...counts.map((c) => c.teleopCounts.cl3 || 0)),
							calculateAverage(counts.map((c) => c.teleopCounts.cl3 || 0)),
							Math.max(...counts.map((c) => c.teleopCounts.cl3 || 0)),
							0,
							0,
							0,
							Math.min(...counts.map((c) => (c.autoCounts.cl3 || 0) + (c.teleopCounts.cl3 || 0))),
							calculateAverage(
								counts.map((c) => (c.autoCounts.cl3 || 0) + (c.teleopCounts.cl3 || 0))
							),
							Math.max(...counts.map((c) => (c.autoCounts.cl3 || 0) + (c.teleopCounts.cl3 || 0)))
						],
						backgroundColor: chartColors[2],
						borderColor: chartBorderColors[2],
						borderWidth: 1
					},
					{
						label: 'Level 4',
						data: [
							Math.min(...counts.map((c) => c.autoCounts.cl4 || 0)),
							calculateAverage(counts.map((c) => c.autoCounts.cl4 || 0)),
							Math.max(...counts.map((c) => c.autoCounts.cl4 || 0)),
							Math.min(...counts.map((c) => c.teleopCounts.cl4 || 0)),
							calculateAverage(counts.map((c) => c.teleopCounts.cl4 || 0)),
							Math.max(...counts.map((c) => c.teleopCounts.cl4 || 0)),
							0,
							0,
							0,
							Math.min(...counts.map((c) => (c.autoCounts.cl4 || 0) + (c.teleopCounts.cl4 || 0))),
							calculateAverage(
								counts.map((c) => (c.autoCounts.cl4 || 0) + (c.teleopCounts.cl4 || 0))
							),
							Math.max(...counts.map((c) => (c.autoCounts.cl4 || 0) + (c.teleopCounts.cl4 || 0)))
						],
						backgroundColor: chartColors[3],
						borderColor: chartBorderColors[3],
						borderWidth: 1
					},
					{
						label: 'Barge',
						data: [
							Math.min(...counts.map((c) => c.autoCounts.brg || 0)),
							calculateAverage(counts.map((c) => c.autoCounts.brg || 0)),
							Math.max(...counts.map((c) => c.autoCounts.brg || 0)),
							Math.min(...counts.map((c) => c.teleopCounts.brg || 0)),
							calculateAverage(counts.map((c) => c.teleopCounts.brg || 0)),
							Math.max(...counts.map((c) => c.teleopCounts.brg || 0)),
							0,
							0,
							0,
							Math.min(...counts.map((c) => (c.autoCounts.brg || 0) + (c.teleopCounts.brg || 0))),
							calculateAverage(
								counts.map((c) => (c.autoCounts.brg || 0) + (c.teleopCounts.brg || 0))
							),
							Math.max(...counts.map((c) => (c.autoCounts.brg || 0) + (c.teleopCounts.brg || 0)))
						],
						backgroundColor: chartColors[4],
						borderColor: chartBorderColors[4],
						borderWidth: 1
					},
					{
						label: 'Processor',
						data: [
							Math.min(...counts.map((c) => c.autoCounts.prc || 0)),
							calculateAverage(counts.map((c) => c.autoCounts.prc || 0)),
							Math.max(...counts.map((c) => c.autoCounts.prc || 0)),
							Math.min(...counts.map((c) => c.teleopCounts.prc || 0)),
							calculateAverage(counts.map((c) => c.teleopCounts.prc || 0)),
							Math.max(...counts.map((c) => c.teleopCounts.prc || 0)),
							0,
							0,
							0,
							Math.min(...counts.map((c) => (c.autoCounts.prc || 0) + (c.teleopCounts.prc || 0))),
							calculateAverage(
								counts.map((c) => (c.autoCounts.prc || 0) + (c.teleopCounts.prc || 0))
							),
							Math.max(...counts.map((c) => (c.autoCounts.prc || 0) + (c.teleopCounts.prc || 0)))
						],
						backgroundColor: chartColors[5],
						borderColor: chartBorderColors[5],
						borderWidth: 1
					},
					{
						label: 'Shallow Climb',
						data: [
							0, // auto
							0, // auto
							0, // auto
							0, // tele
							0, // tele
							0, // tele
							Math.min(...counts.map((c) => c.endgameCounts.shc || 0)),
							calculateAverage(counts.map((c) => c.endgameCounts.shc || 0)),
							Math.max(...counts.map((c) => c.endgameCounts.shc || 0)),
							Math.min(...counts.map((c) => c.endgameCounts.shc || 0)),
							calculateAverage(counts.map((c) => c.endgameCounts.shc || 0)),
							Math.max(...counts.map((c) => c.endgameCounts.shc || 0))
						],
						backgroundColor: chartColors[6],
						borderColor: chartBorderColors[6],
						borderWidth: 1
					},
					{
						label: 'Deep Climb',
						data: [
							0, // auto
							0, // auto
							0, // auto
							0, // tele
							0, // tele
							0, // tele
							Math.min(...counts.map((c) => c.endgameCounts.dpc || 0)),
							calculateAverage(counts.map((c) => c.endgameCounts.dpc || 0)),
							Math.max(...counts.map((c) => c.endgameCounts.dpc || 0)),
							Math.min(...counts.map((c) => c.endgameCounts.dpc || 0)),
							calculateAverage(counts.map((c) => c.endgameCounts.dpc || 0)),
							Math.max(...counts.map((c) => c.endgameCounts.dpc || 0))
						],
						backgroundColor: chartColors[7],
						borderColor: chartBorderColors[7],
						borderWidth: 1
					},
					{
						label: 'Parked',
						data: [
							0, // auto
							0, // auto
							0, // auto
							0, // tele
							0, // tele
							0, // tele
							Math.min(...counts.map((c) => c.endgameCounts.prk || 0)),
							calculateAverage(counts.map((c) => c.endgameCounts.prk || 0)),
							Math.max(...counts.map((c) => c.endgameCounts.prk || 0)),
							Math.min(...counts.map((c) => c.endgameCounts.prk || 0)),
							calculateAverage(counts.map((c) => c.endgameCounts.prk || 0)),
							Math.max(...counts.map((c) => c.endgameCounts.prk || 0))
						],
						backgroundColor: chartColors[8],
						borderColor: chartBorderColors[8],
						borderWidth: 1
					}
				];

				for (let i = 0; i < actionDatasets.length; i++) {
					actionDatasets[i].backgroundColor = chartColors[i];
					actionDatasets[i].borderColor = chartBorderColors[i];
					actionDatasets[i].borderWidth = 1;
				}

				const chartLabels = [
					'Min Auto',
					'Avg Auto',
					'Max Auto',
					'Min Tele',
					'Avg Tele',
					'Max Tele',
					'Min End',
					'Avg End',
					'Max End',
					'Min Total',
					'Avg Total',
					'Max Total'
				];

				chart = new Chart(canvas, {
					type: 'bar',
					data: {
						labels: chartLabels,
						datasets: actionDatasets
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						scales: {
							y: {
								beginAtZero: true,
								stacked: true
							},
							x: {
								stacked: true
							}
						}
					}
				});
			} catch (error) {
				console.error(`Error generating progress chart for team ${team.tba.team_number}:`, error);
			}
		});
	});
</script>

<canvas bind:this={canvas} class="h-100 w-100"></canvas>
