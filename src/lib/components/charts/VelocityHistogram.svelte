<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';
	import type { TBAMatch } from 'tatorscout/tba';
	import type { Scouting } from '$lib/model/scouting';

  Chart.register(BarController, BarElement, CategoryScale, LinearScale);

  	interface Props {
		  scouting: Scouting.MatchScoutingExtendedArr;
		  bins?: number;
	  }

	const { scouting, bins }: Props = $props();
  

  let canvas: HTMLCanvasElement;
  let chart: Chart;              
  //const maxVelocity = Math.max(...matches.flatMap(m => m.velocityMap()));
  //const bucketSize = maxVelocity / bins;

    
  // const labels = Array.from({ length: bins }, (_, i) => {
  //      const start = (i * bucketSize).toFixed(1);
  //      const end = ((i + 1) * bucketSize).toFixed(1);
  //      return `${start}–${end} fps`;
  //});

  const render = () => {
		if (chart) {
			chart.destroy();
		}

		chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [1,2,4,8,16,32,64],          
      datasets: [{
        label: 'Velocity Histogram (Event)',
        data: [65, 59, 80, 81, 56, 55, 40],  
        
				backgroundColor: 'rgba(255, 206, 86, 0.2)',
				borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Occurrences' } },
                x: { title: { display: true, text: 'Velocity Range' } }
      }
    }
  });
	};

	onMount(() => {
		render();
		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});

</script>

<canvas bind:this={canvas}></canvas>

