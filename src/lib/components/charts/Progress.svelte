<!--
@fileoverview Progress chart showing action frequency or points across matches.

@component Progress

@description
Renders a stacked bar chart for a team's match-by-match performance. It can toggle between
frequency (counts per action) and points (scored points per action) views. The chart is rebuilt
whenever the scouting store updates, ensuring the visual stays in sync with incoming data.

@example
```svelte
<script lang="ts">
	import Progress from '$lib/components/charts/Progress.svelte';
	import type { TBATeam, TBAMatch, TBAEvent } from '$lib/utils/tba';
	import type { Scouting } from '$lib/model/scouting';

	let team: TBATeam;
	let event: TBAEvent;
	let matches: TBAMatch[] = [];
	let scouting: Scouting.MatchScoutingExtendedArr;

	let chartRef: Progress | undefined;
	const copyChart = () => chartRef?.copy(true);
</script>

<Progress bind:this={chartRef} {team} {event} {matches} {scouting} defaultView="frequency" />
```
-->
<script lang="ts">
	import { compliment } from '$lib/model/match-html';
	import { Scouting } from '$lib/model/scouting';
	import { copyCanvas } from '$lib/utils/clipboard';
	import { TBATeam, TBAEvent, TBAMatch } from '$lib/utils/tba';
	import { Chart } from 'chart.js';
	import { onMount } from 'svelte';
	import { capitalize } from 'ts-utils';
	import { debounce } from 'ts-utils';

	/** Component props for `Progress`. */
	interface Props {
		/** Team being visualized. */
		team: TBATeam;
		/** Event context for the matches. */
		event: TBAEvent;
		/** List of matches for label alignment. */
		matches: TBAMatch[];
		/** Optional fixed Y value for other layouts (bindable). */
		staticY?: number;
		/** Live scouting store for match data. */
		scouting: Scouting.MatchScoutingExtendedArr;
		/** Default chart view mode. */
		defaultView?: 'frequency' | 'points';
	}

	let { staticY = $bindable(), scouting, defaultView, event }: Props = $props();

	let view = $derived(defaultView || 'frequency');

	let canvas: HTMLCanvasElement;
	let chart: Chart;

	const labels = $derived(scouting.map(s => `${s.compLevel}${s.matchNumber}`));

	/**
	 * Copy the chart canvas to the clipboard.
	 *
	 * @example
	 * ```ts
	 * chartRef.copy(true);
	 * ```
	 */
	export const copy = (notify: boolean) => copyCanvas(canvas, notify);

	const frequencyDataset  = $derived(scouting.derive(matches => {
		const yearInfo = Scouting.getYearInfo(event.tba.year);
		if (yearInfo.isErr()) {
			console.error(`Failed to get year info for ${event.tba.year}: ${yearInfo.error}`);
			return [];
		}

		const actions = yearInfo.value.actions;
		const colors = compliment(Object.values(actions).length);

		return Object.entries(actions).map(([key, name], i) => {
			return {
				label: name,
				data: matches.map(match => {
					let count = 0;
					for (const [,,,a] of match.data.trace.points) {
						if (a === key) count++;
					}
					return count;
				}),
				backgroundColor: colors[i].clone().setAlpha(0.3).toString('rgba'),
				borderColor: colors[i].clone().setAlpha(0.7).toString('rgba'),
				borderWidth: 1,
			}
		});
	}));
	const pointDataset = $derived(scouting.derive(matches => {
		const yearInfo = Scouting.getYearInfo(event.tba.year);
		if (yearInfo.isErr()) {
			console.error(`Failed to get year info for ${event.tba.year}: ${yearInfo.error}`);
			return [];	
		}

		const actions = yearInfo.value.actions;
		const colors = compliment(Object.values(actions).length);

		const parsed = matches.map(match => yearInfo.value.parse(match.data.trace));

		const num = (data: unknown) => {
			if (isNaN(Number(data))) return 0;
			return Number(data);
		}

		return Object.entries(actions).map(([key, name], i) => {
			return {
				label: name,
				// +num to convert to number if undefined
				data: parsed.map(p => num(p.auto[key as keyof typeof p.auto]) + num(p.teleop[key as keyof typeof p.teleop]) + num(p.endgame[key as keyof typeof p.endgame])),
				backgroundColor: colors[i].clone().setAlpha(0.3).toString('rgba'),
				borderColor: colors[i].clone().setAlpha(0.7).toString('rgba'),
				borderWidth: 1,
			};
		});
	}));

	const render = debounce(() => {
		if (chart) chart.destroy();
		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels: labels.data,
				datasets: view === 'frequency' ? frequencyDataset.data : pointDataset.data,
			},
			options: {
				responsive: true,
				scales: {
					x: {
						stacked: true,
					},
					y: {
						stacked: true,
						beginAtZero: true,
						max: view === 'frequency' ? undefined : staticY || undefined,
					},
				},
			},
		});
	}, 100);

	onMount(() => {
		const unsubs = [
			scouting.subscribe(render),
			frequencyDataset.subscribe(render),
			pointDataset.subscribe(render),
		];

		return () => {
			unsubs.forEach(unsub => unsub());
			if (chart) chart.destroy();
		};
	});
</script>

<div class="chart-container">
	<button
		class="btn btn-primary"
		onclick={() => {
			view = view === 'frequency' ? 'points' : 'frequency';
			render();
		}}
	>
		Viewing: {capitalize(view)} (click to toggle)
	</button>

	<canvas bind:this={canvas} class="w-100"></canvas>
</div>

<style>
	.chart-container {
		position: relative;
		height: 250px;
	}

	.chart-container canvas {
		max-height: 100%;
	}
</style>
