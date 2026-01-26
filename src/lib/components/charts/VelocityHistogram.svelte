<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';

  Chart.register(BarController, BarElement, CategoryScale, LinearScale);

  export let matches: any[]; // array of match objects
  export let bins = 10;      

  let canvas: HTMLCanvasElement;
  let chart: Chart;              
  const maxVelocity = Math.max(...matches.flatMap(m => m.velocityMap()));
  const bucketSize = maxVelocity / bins;

    
  const labels = Array.from({ length: bins }, (_, i) => {
        const start = (i * bucketSize).toFixed(1);
        const end = ((i + 1) * bucketSize).toFixed(1);
        return `${start}–${end} fps`;
  });

  chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,           // X-axis
      datasets: [{
        label: 'Velocity Distribution (Event)',
        data: eventBuckets,  // Y-axis
        backgroundColor: '#2c2442ff'
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

</script>

<canvas bind:this={canvas}></canvas>

