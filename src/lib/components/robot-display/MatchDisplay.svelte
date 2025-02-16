<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { FIRST } from '$lib/model/FIRST';
	import { onMount } from 'svelte';
	import { MatchCanvas } from '$lib/model/match-canvas';
	import type { TBATeam } from 'tatorscout/tba';
	import type { Focus } from '$lib/types/robot-display';

	interface Props {
		match: Scouting.MatchScoutingData;
		team: TBATeam;
		focus: Focus;
		year: number;
	}

	const { match, team, focus, year }: Props = $props();

	let canvas: HTMLCanvasElement;
	let matchCanvas: MatchCanvas;
	let stop = $state(() => {});

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Could not get 2d context');
		const pullTrace = match.pull('trace');
		if (!pullTrace) throw new Error('No trace data');
		const parsed = Scouting.parseTrace(pullTrace.data.trace);
		if (parsed.isErr()) throw new Error(`Error parsing trace: ${parsed.error.message}`);

		matchCanvas = new MatchCanvas(parsed.value, year, ctx, {
			amp: 'red',
			bal: 'blue',
			cbe: 'green',
			clb: 'yellow',
			cne: 'purble',
			lob: 'orange',
			nte: 'black',
			pck: 'white',
			spk: 'pink',
			src: 'brown',
			trp: 'cyan'
		});

		stop = matchCanvas.animate();

		matchCanvas.focus(focus);
		return () => {
			stop();
		};
	});
</script>

<div class="container-fluid">
	<div class="row">
		<canvas bind:this={canvas} style:height="300px"></canvas>
	</div>
</div>
