<script lang="ts" generics="T extends Record<string, number>">
	import { onMount } from 'svelte';
	import { TBATeam } from '$lib/utils/tba';
	import Chart from 'chart.js/auto';
	import { copyCanvas } from '$lib/utils/clipboard';

	interface Props {
		team: TBATeam;
		data: T;
		opts?: {
			max?: number;
			min?: number;
		};
	}

	const { team, data, opts }: Props = $props();
	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart;

	export const copy = (notify: boolean) => copyCanvas(chartCanvas, notify);

	const render = () => {
		if (chartInstance) {
			chartInstance.destroy();
		}

		chartInstance = new Chart(chartCanvas, {
			type: 'radar',
			data: {
				labels: Object.keys(data),
				datasets: [
					{
						label: String(team.tba.team_number),
						data: Object.values(data),
						backgroundColor: 'rgba(255, 99, 132, 0.2)',
						borderColor: 'rgba(255, 99, 132, 1)'
					}
				]
			},
			options: {
				scales: {
					r: {
						min: opts?.min ?? 0,
						max: opts?.max ?? Math.max(...Object.values(data)) + 1,
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
	};

	onMount(() => {
		render();
		return () => {
			if (chartInstance) {
				chartInstance.destroy();
			}
		};
	});
</script>

<canvas bind:this={chartCanvas} style="height: 400px;"></canvas>
