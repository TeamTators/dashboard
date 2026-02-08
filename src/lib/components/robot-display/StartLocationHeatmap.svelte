<!--
@fileoverview Start location heatmap for match scouting traces.

@component StartLocationHeatmap

@description
Builds and renders a start-location heatmap for the provided scouting data and year.

@example
```svelte
<StartLocationHeatmap {scouting} year={2025} />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import { StartLocation } from '$lib/model/match-html';

	interface Props {
		/** Scouting data source for start locations. */
		scouting: Scouting.MatchScoutingExtendedArr;
		/** Competition year for action map selection. */
		year: number;
	}

	const { scouting, year }: Props = $props();

	let target: HTMLDivElement;

	onMount(() => {
		const heatmap = new StartLocation(scouting, year);

		return heatmap.init(target);
	});
</script>

<div bind:this={target}></div>
