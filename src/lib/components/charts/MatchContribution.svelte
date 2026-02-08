<!--
@fileoverview Stacked bar chart for a single match contribution breakdown.

@component MatchContribution

@description
Computes auto, teleop, and endgame point totals for a specific team in a given match. The component
parses the scouting trace, combines it with official TBA breakdowns, and renders a stacked bar chart
showing mobility, coral, algae, and endgame points.

@example
```svelte
<script lang="ts">
	import MatchContribution from '$lib/components/charts/MatchContribution.svelte';
	import type { TBAMatch, TBATeam, TBAEvent } from '$lib/utils/tba';
	import type { Scouting } from '$lib/model/scouting';

	let match: TBAMatch;
	let team: TBATeam;
	let event: TBAEvent;
	let scouting: Scouting.MatchScoutingExtended;

	let chartRef: MatchContribution | undefined;
	const copyChart = () => chartRef?.copy(true);
</script>

<MatchContribution bind:this={chartRef} {match} {team} {event} {scouting} />
```
-->
<script lang="ts">
	import type { Scouting } from '$lib/model/scouting';
	import { copyCanvas } from '$lib/utils/clipboard';
	import { TBAEvent, TBAMatch, TBATeam } from '$lib/utils/tba';
	import { Chart } from 'chart.js';
	import { onMount } from 'svelte';
	import YearInfo2025 from 'tatorscout/years/2025.js';
	import { match as matchCase } from 'ts-utils/match';

	/** Component props for `MatchContribution`. */
	interface Props {
		/** Match being visualized. */
		match: TBAMatch;
		/** Scouting data for the match. */
		scouting: Scouting.MatchScoutingExtended;
		/** Team to compute contribution for. */
		team: TBATeam;
		/** Event context for the match. */
		event: TBAEvent;
		/** Optional style string passed to the canvas. */
		style?: string;
	}

	const { scouting, team, match, style }: Props = $props();

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
		const ctx = canvas.getContext('2d');
		if (!ctx) return console.error('Could not get canvas context');
		try {
			let endgamePoints = 0;
			let autoPoints = 0;
			MATCH2025: {
				const match2025Res = match.asYear(2025);
				if (match2025Res.isErr()) break MATCH2025;
				const match2025 = match2025Res.unwrap();
				const redPosition = match2025.alliances.red.team_keys.indexOf(team.tba.key);
				const bluePosition = match2025.alliances.blue.team_keys.indexOf(team.tba.key);
				const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
				const position = alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
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

					endgamePoints = matchCase<string, number>(endgameRobots[position])
						.case('Parked', () => 2)
						.case('ShallowCage', () => 6)
						.case('DeepCage', () => 12)
						.default(() => 0)
						.exec()
						.unwrap();
				}
			}

			const res = YearInfo2025.parse(scouting.trace);

			const chart = new Chart(canvas, {
				type: 'bar',
				data: {
					datasets: [
						{
							label: 'Mobility Points',
							data: [autoPoints, 0, 0, autoPoints]
						},
						{
							label: 'Coral Points',
							data: [
								res.auto.cl1 + res.auto.cl2 + res.auto.cl3 + res.auto.cl4,
								res.teleop.cl1 + res.teleop.cl2 + res.teleop.cl3 + res.teleop.cl4,
								0,
								res.auto.cl1 +
									res.auto.cl2 +
									res.auto.cl3 +
									res.auto.cl4 +
									res.teleop.cl1 +
									res.teleop.cl2 +
									res.teleop.cl3 +
									res.teleop.cl4
							]
						},
						{
							label: 'Algae Points',
							data: [
								res.auto.brg + res.auto.prc,
								res.teleop.brg + res.teleop.prc,
								0,
								res.auto.brg + res.auto.prc + res.teleop.brg + res.teleop.prc
							]
						},
						{
							label: 'Endgame Points',
							data: [0, 0, endgamePoints, endgamePoints]
						}
					],
					labels: ['Auto', 'Teleop', 'Endgame', 'Total']
				},
				options: {
					scales: {
						y: {
							stacked: true
						},
						x: {
							stacked: true
						}
					},
					responsive: true,
					maintainAspectRatio: false
				}
			});

			chart.render();

			return () => chart.destroy();
		} catch (error) {
			console.error('Could not render chart', error);
		}
	});
</script>

<canvas bind:this={canvas} {style}></canvas>
