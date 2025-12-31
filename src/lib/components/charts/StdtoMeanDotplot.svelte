<script lang="ts">
	import Chart from 'chart.js/auto';
	import { onMount } from 'svelte';
    import { Scouting } from '$lib/model/scouting';
	import type { ChartData } from 'chart.js';

    let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart;

     interface Props {
		summary: {
            [group: string]: {
                [item: string]: {
                    team: number;
                    value: number;
                }[];
            };
        };
	}

    const { summary }: Props = $props();
    let data = {datasets: [{
                label: '2122',
                data: [{ x: -10, y: 0 }],
                backgroundColor: 'rgb(255, 99, 132)'
            },{
                label: '360',
                data: [{ x: 10, y: 0 }],
                backgroundColor: 'rgb(255, 99, 132)'
            }]};

    const render = () => {
        if (!summary?.['Average Velocity']) {
            return; 
        }

		if (chartInstance) {
			chartInstance.destroy();
		}

        data = {datasets: []};

        for (const [, teams] of Object.entries(summary['Average Velocity'])) {
            if (!teams.length) continue;
            
            data.datasets.push({
                label: teams[0].team.toString(),
                data: [{ x: teams[0].value, y: 5 }],
                backgroundColor: 'rgb(255, 99, 132)'
            });
        }
        
        chartInstance = new Chart(chartCanvas, {
            type: 'scatter',
            data: data,
            options: {
                scales: {
                x: {
                    type: 'linear',
                    position: 'bottom'
                }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        })
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

<div class="card layer-2 px-0 mx-0 w-100">
						<div class="card-header">
							<h5 class="card-title mb-0" color="white">Standard Deviation vs Mean</h5>
						</div>
						<div class="card-body px-0 mx-0">
							<div class="scroller w-100">
								<div class="chart-container">
	                                <canvas bind:this={chartCanvas} style="height: 400px;"></canvas>
								</div>
							</div>
						</div>
					</div>