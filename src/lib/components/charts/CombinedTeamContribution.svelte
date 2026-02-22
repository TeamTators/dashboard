<!--
@fileoverview Placeholder for an alliance-level graph for 2025 scoring categories.

@component AllianceGraph

@description
This component is currently a stub. The comment block enumerates the 2025 scoring items that the
future chart should visualize once implemented.

@example
```svelte
<AllianceGraph />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import type { TBAEvent, TBATeam } from '$lib/utils/tba';
	import { Chart } from 'chart.js';
	import { onMount } from 'svelte';
	import { registerables } from 'chart.js';
	import type { WritableBase } from '$lib/services/writables';

	Chart.register(...registerables);

	interface Props {
		event: TBAEvent;
		teams: Scouting.MatchScoutingExtendedArr[];
		staticY: WritableBase<number>;
		type: 'max' | 'average';
	}

	const { event, teams, staticY, type }: Props = $props();

	const render = () => {
		if (chart) chart.destroy();

		const yearInfo = Scouting.getYearInfo(event.tba.year);
		if (yearInfo.isErr()) {
			return console.error('Unsupported year for scouting data visualization');
		}

		const actions = yearInfo.value.actions;

		const maxValue = Object.fromEntries(Object.entries(actions).map(([_, key]) => [key, 0]));

		const datasets = (chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: Object.values(actions),
				datasets: teams.map((team) => {
					return {
						data: Object.values(actions).map((key) => {
							const contribution = team.contribution(event.tba.year, false, type);
							if (contribution.isErr()) {
								console.error(
									`Error calculating contribution for team ${team.team}:`,
									contribution.error
								);
								return 0;
							}
							const val = contribution.value[key] || 0;
							maxValue[key] += val;
							return val;
						}),
						label: `Team ${team.team} (${type})`
					};
				})
			},
			options: {
				scales: {
					y: {
						beginAtZero: true,
						stacked: true,
						max: staticY.data > 0 ? Math.ceil(staticY.data * 1.1) : undefined
					},
					x: {
						stacked: true
					}
				}
			}
		}));

		if (Math.max(...Object.values(maxValue)) > staticY.data) {
			staticY.set(Math.max(...Object.values(maxValue)));
		}
	};

	let canvas: HTMLCanvasElement;
	let chart: Chart;

	onMount(() => {
		render();
		const subs = teams.map((t) => t.subscribe(() => render()));
		subs.push(staticY.subscribe(() => render()));
		return () => {
			chart?.destroy();
			for (const unsub of subs) unsub();
		};
	});
</script>

<canvas bind:this={canvas}></canvas>
