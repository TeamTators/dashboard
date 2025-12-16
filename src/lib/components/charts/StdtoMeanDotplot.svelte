<script lang="ts">
	import Chart from 'chart.js/auto';
	import { onMount } from 'svelte';

    let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart;

	const data = {
        datasets: [{
            label: '2122',
            data: [{
            x: -10,
            y: 0
            }, {
            x: 0,
            y: 10
            }, {
            x: 10,
            y: 5
            }, {
            x: 0.5,
            y: 5.5
            }],
            backgroundColor: 'rgb(255, 99, 132)'
        }],
    };

    const render = () => {
		if (chartInstance) {
			chartInstance.destroy();
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
    }

    onMount(() => {
		render();
		return () => {
			if (chartInstance) {
				chartInstance.destroy();
			}
		};
	});
</script>

<div class="card-body">
	<h2 color="white">Standard Deviation vs Mean</h2>
	<canvas bind:this={chartCanvas} style="height: 400px;"></canvas>
</div>

