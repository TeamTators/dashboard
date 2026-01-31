<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';
	import type { TBAMatch } from 'tatorscout/tba';
	import type { Scouting } from '$lib/model/scouting';

  Chart.register(BarController, BarElement, CategoryScale, LinearScale); //this is the stuff that is needed for the chart to actually appear as a chart

  	interface Props {
		  scouting: Scouting.MatchScoutingExtendedArr; //takes the class from scouting.ts
		  bins?: number; //makes sure only numeric values are assigned to bins to make it type safe I think
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
  /*I think this means that when the page renders again 
  (like when you click on a new team), it will get rid of the chart and make a new one with
  the new data

  */

  //this is setting what the chart looks like, with like the colors and bin labels
		chart = new Chart(canvas, { 
    type: 'bar',
    data: {
      labels: [1,2,4,8,16,32,64],  //these are just random numbers :(        
      datasets: [{
        label: 'Velocity Histogram (Event)',
        data: [65, 59, 80, 81, 56, 55, 40],  //also just random numbers 
        
				backgroundColor: 'rgba(255, 206, 86, 0.2)',
				borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Occurrences' } }, //labels the y-axis "occurences" and makes it begin at 0
                x: { title: { display: true, text: 'Velocity Range' } } //labels the x-axis "Velocity Range"
      }
    }
  });
	};

  /* when the stuff on the page loads, it renders the chart, and if there already is a chart, it gets rid of it
  so that data from other teams' data doesnt show up on the chart
  */
	onMount(() => {
		render();
		return () => {
			if (chart) {
				chart.destroy(); //returns the check of whether or not a chart with old data was there and got destroyed
			}
		};
	});

</script>

<canvas bind:this={canvas}></canvas>

