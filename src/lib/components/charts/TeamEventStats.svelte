<!--
@fileoverview Event-level min/avg/max action stats for a team, rendered as a stacked bar chart.

@component TeamEventStats

@description
Builds a Chart.js stacked bar chart that aggregates match-by-match scouting data into
min/avg/max buckets for auto, teleop, endgame, and total actions. Each dataset corresponds to a
specific action (e.g., Level 1, Barge, Shallow Climb).

@example
```svelte
<script lang="ts">
  import TeamEventStats from '$lib/components/charts/TeamEventStats.svelte';
  import type { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';
  import type { Scouting } from '$lib/model/scouting';

  let team: TBATeam;
  let event: TBAEvent;
  let matches: TBAMatch[] = [];
  let scouting: Scouting.MatchScoutingExtendedArr;

  let chartRef: TeamEventStats | undefined;
  const copyChart = () => chartRef?.copy(true);
</script>

<TeamEventStats bind:this={chartRef} {team} {event} {matches} {scouting} />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';
	import { Chart } from 'chart.js';
	import { onMount } from 'svelte';
	import { Trace, type P } from 'tatorscout/trace';
	import { copyCanvas } from '$lib/utils/clipboard';
	import { compliment } from '$lib/model/match-html';

	/** Component props for `TeamEventStats`. */
	interface Props {
		/** Team being visualized. */
		team: TBATeam;
		/** Event context for match ordering. */
		event: TBAEvent;
		/** Optional fixed Y value for other layouts (bindable). */
		staticY?: number;
		/** Live scouting store for match data. */
		scouting: Scouting.MatchScoutingExtendedArr;
		/** All TBA matches for label alignment. */
		matches: TBAMatch[];
	}

	let { team, staticY = $bindable(), scouting, event }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart;

	/**
	 * Copy the chart canvas to the clipboard.
	 *
	 * @example
	 * ```ts
	 * chartRef.copy(true);
	 * ```
	 */
	export const copy = (notify: boolean) => copyCanvas(canvas, notify);

	const datasets = $derived(
		scouting.derive((matches) => {
			const yearInfo = Scouting.getYearInfo(event.tba.year);
			if (yearInfo.isErr()) {
				return [];
			}

			const actions = yearInfo.value.actions;
			const colors = compliment(Object.keys(actions).length);

			const parsed = matches.map((m) => yearInfo.value.parse(m.data.trace));

			return Object.entries(actions).map(([key, name], i) => {
				let minAuto = Infinity;
				let maxAuto = -Infinity;
				let avgAuto = 0;
				let minTele = Infinity;
				let maxTele = -Infinity;
				let avgTele = 0;
				let minEnd = Infinity;
				let maxEnd = -Infinity;
				let avgEnd = 0;

				for (const m of parsed) {
					const auto = m.auto[key as keyof typeof m.auto] || 0;
					const tele = m.teleop[key as keyof typeof m.teleop] || 0;
					const end = m.endgame[key as keyof typeof m.endgame] || 0;

					minAuto = Math.min(minAuto, auto);
					maxAuto = Math.max(maxAuto, auto);
					avgAuto += auto;

					minTele = Math.min(minTele, tele);
					maxTele = Math.max(maxTele, tele);
					avgTele += tele;

					minEnd = Math.min(minEnd, end);
					maxEnd = Math.max(maxEnd, end);
					avgEnd += end;
				}

				avgAuto /= parsed.length;
				avgTele /= parsed.length;
				avgEnd /= parsed.length;

				return {
					label: name,
					data: [minAuto, avgAuto, maxAuto, minTele, avgTele, maxTele, minEnd, avgEnd, maxEnd],
					backgroundColor: colors[i].clone().setAlpha(0.3).toString('rgba'),
					borderColor: colors[i].clone().setAlpha(0.7).toString('rgba'),
					borderWidth: 1
				};
			});
		})
	);

	const render = () => {
		if (chart) chart.destroy();

		const chartLabels = [
			'Min Auto',
			'Avg Auto',
			'Max Auto',
			'Min Tele',
			'Avg Tele',
			'Max Tele',
			'Min End',
			'Avg End',
			'Max End'
		];

		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: chartLabels,
				datasets: datasets.data
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
	};

	onMount(() => {
		const unsub = datasets.subscribe(render);
		return () => {
			unsub();
			if (chart) chart.destroy();
		};
	});
</script>

<canvas bind:this={canvas} class="h-100 w-100"></canvas>
