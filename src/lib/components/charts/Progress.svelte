<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { copyCanvas } from '$lib/utils/clipboard';
	import { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';
	import { Chart } from 'chart.js';
	import { onMount } from 'svelte';
	import { Trace, TraceSchema, type TraceArray } from 'tatorscout/trace';
	import YearInfo2025 from 'tatorscout/years/2025';
	import { match as matchCase } from 'ts-utils/match';

	interface Props {
		team: TBATeam;
		event: TBAEvent;
		matches: TBAMatch[];
		staticY?: number;
		scouting: Scouting.MatchScoutingArr;
		defaultView?: 'frequency' | 'points';
	}

	let { team, event, matches, staticY = $bindable(), scouting, defaultView }: Props = $props();

	let view = $state(defaultView);

	let canvas: HTMLCanvasElement;
	let chart: Chart;

	export const copy = (notify: boolean) => copyCanvas(canvas, notify);

	type datasetType = {
		label: string;
		data: number[];
		backgroundColor: string;
		borderColor: string;
		borderWidth: number;
	}[];

	let frequencyDataset: datasetType;
	let pointDataset: datasetType;

	onMount(() => {
		scouting.sort((a, b) => {
			if (a.data.compLevel === b.data.compLevel)
				return Number(a.data.matchNumber) - Number(b.data.matchNumber);
			const order = ['qm', 'qf', 'sf', 'f'];
			return order.indexOf(String(a.data.compLevel)) - order.indexOf(String(b.data.compLevel));
		});

		return scouting.subscribe(async (data) => {
			if (chart) chart.destroy();
			try {
				const countsPerMatch = data.map((d) => {
					const trace = Trace.parse(d.data.trace).unwrap();

					return trace.points.reduce(
						(acc, curr) => {
							if (!curr[3]) return acc;
							if (
								['cl1', 'cl2', 'cl3', 'cl4', 'brg', 'prc', 'shc', 'dpc', 'prk'].includes(
									curr[3] as string
								)
							) {
								acc[curr[3] as string] = (acc[curr[3] as string] || 0) + 1;
							}
							return acc;
						},
						{} as Record<string, number>
					);
				});

				const score = data.map((s) => {
					const match = matches.find(
						(m) =>
							m.tba.match_number === s.data.matchNumber && m.tba.comp_level === s.data.compLevel
					);
					const traceScore = YearInfo2025.parse(Trace.parse(s.data.trace).unwrap());
					if (!match)
						return {
							traceScore,
							autoPoints: 0,
							endgamePoints: {
								parked: 0,
								shallow: 0,
								deep: 0
							}
						};
					const match2025Res = match.asYear(2025);
					if (match2025Res.isErr())
						return {
							traceScore,
							autoPoints: 0,
							endgamePoints: {
								parked: 0,
								shallow: 0,
								deep: 0
							}
						};
					const match2025 = match2025Res.unwrap();
					const redPosition = match2025.alliances.red.team_keys.indexOf(team.tba.key);
					const bluePosition = match2025.alliances.blue.team_keys.indexOf(team.tba.key);
					const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
					const position =
						alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
					let endgamePoints = {
						parked: 0,
						shallow: 0,
						deep: 0
					};
					let autoPoints = 0;
					if (alliance) {
						const mobilityRobots = [
							match2025.score_breakdown[alliance].autoLineRobot1,
							match2025.score_breakdown[alliance].autoLineRobot2,
							match2025.score_breakdown[alliance].autoLineRobot3
						];

						autoPoints = 3 * Number(mobilityRobots[position] === 'Yes');

						const endgameRobots = [
							match2025.score_breakdown[alliance].endGameRobot1, // Parked, DeepClimb, ShallowClimb
							match2025.score_breakdown[alliance].endGameRobot2,
							match2025.score_breakdown[alliance].endGameRobot3
						];

						const endgameResult = matchCase<
							string,
							{ parked: number; shallow: number; deep: number }
						>(endgameRobots[position])
							.case('Parked', () => ({ parked: 2, shallow: 0, deep: 0 }))
							.case('ShallowCage', () => ({ parked: 0, shallow: 6, deep: 0 }))
							.case('DeepCage', () => ({ parked: 0, shallow: 0, deep: 12 }))
							.default(() => ({ parked: 0, shallow: 0, deep: 0 }))
							.exec()
							.unwrap();

						endgamePoints = {
							parked: endgameResult.parked,
							shallow: endgameResult.shallow,
							deep: endgameResult.deep
						};
					}

					return {
						traceScore,
						autoPoints,
						endgamePoints
					};
				});

				const labels = data.map((d) => `${d.data.compLevel}${d.data.matchNumber}`);
				const actionKeys = [
					'cl1', // Level 1
					'cl2', // Level 2
					'cl3', // Level 3
					'cl4', // Level 4
					'brg', // Barge
					'prc', // Processor
					'shc', // Shallow Climb
					'dpc', // Deep Climb
					'prk' // Parked
				];

				const actionLabels = [
					'Level 1',
					'Level 2',
					'Level 3',
					'Level 4',
					'Barge',
					'Processor',
					'Shallow Climb',
					'Deep Climb',
					'Parked'
				];

				const colors = [
					'rgba(255, 99, 132, 0.2)', // Level 1
					'rgba(54, 162, 235, 0.2)', // Level 2
					'rgba(255, 206, 86, 0.2)', // Level 3
					'rgba(75, 192, 192, 0.2)', // Level 4
					'rgba(153, 102, 255, 0.2)', // Barge
					'rgba(255, 159, 64, 0.2)', // Processor
					'rgba(201, 203, 207, 0.2)', // Park
					'rgba(100, 149, 237, 0.2)', // Shallow Climb
					'rgba(255, 215, 0, 0.2)' // Deep Climb
				];

				const borderColors = [
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

				frequencyDataset = actionKeys.map((key, index) => {
					return {
						label: actionLabels[index],
						data: countsPerMatch.map((count) => count[key] || 0),
						backgroundColor: colors[index % colors.length],
						borderColor: borderColors[index % borderColors.length],
						borderWidth: 1
					};
				});

				pointDataset = [
					{
						label: 'Level 1',
						data: score.map((s) => s.traceScore.auto.cl1 + s.traceScore.teleop.cl1),
						backgroundColor: colors[0],
						borderColor: borderColors[0],
						borderWidth: 1
					},
					{
						label: 'Level 2',
						data: score.map((s) => s.traceScore.auto.cl2 + s.traceScore.teleop.cl2),
						backgroundColor: colors[1],
						borderColor: borderColors[1],
						borderWidth: 1
					},
					{
						label: 'Level 3',
						data: score.map((s) => s.traceScore.auto.cl3 + s.traceScore.teleop.cl3),
						backgroundColor: colors[2],
						borderColor: borderColors[2],
						borderWidth: 1
					},
					{
						label: 'Level 4',
						data: score.map((s) => s.traceScore.auto.cl4 + s.traceScore.teleop.cl4),
						backgroundColor: colors[3],
						borderColor: borderColors[3],
						borderWidth: 1
					},
					{
						label: 'Barge',
						data: score.map((s) => s.traceScore.auto.brg + s.traceScore.teleop.brg),
						backgroundColor: colors[4],
						borderColor: borderColors[4],
						borderWidth: 1
					},
					{
						label: 'Processor',
						data: score.map((s) => s.traceScore.auto.prc + s.traceScore.teleop.prc),
						backgroundColor: colors[5],
						borderColor: borderColors[5],
						borderWidth: 1
					},
					{
						label: 'Shallow Climb',
						data: score.map((s) => s.endgamePoints.shallow),
						backgroundColor: colors[6],
						borderColor: borderColors[6],
						borderWidth: 1
					},
					{
						label: 'Deep Climb',
						data: score.map((s) => s.endgamePoints.deep),
						backgroundColor: colors[7],
						borderColor: borderColors[7],
						borderWidth: 1
					},
					{
						label: 'Parked',
						data: score.map((s) => s.endgamePoints.parked),
						backgroundColor: colors[8],
						borderColor: borderColors[8],
						borderWidth: 1
					}
				];

				chart = new Chart(canvas, {
					type: 'bar',
					data: {
						labels,
						datasets: view === 'frequency' ? frequencyDataset : pointDataset
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

<button
	class="btn btn-primary"
	onclick={() => {
		view = view === 'frequency' ? 'points' : 'frequency';
		chart.data.datasets = view === 'frequency' ? frequencyDataset : pointDataset;
		chart.update();
	}}
>
	{view === 'frequency' ? 'Viewing: Frequency' : 'Viewing: Points'}
</button>

<canvas bind:this={canvas} class="h-100 w-100"></canvas>
