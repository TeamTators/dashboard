<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import { StartLocation } from '$lib/model/match-html';

	interface Props {
		scouting: Scouting.MatchScoutingExtendedArr;
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
