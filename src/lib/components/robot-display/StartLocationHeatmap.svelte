<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import { type TraceArray, type Action } from 'tatorscout/trace';
	import { MatchCanvas } from '$lib/model/match-canvas';
	import type { TBAEvent, TBATeam } from '$lib/utils/tba';

	interface Props {
		team: TBATeam;
		event: TBAEvent;
	}

	const { team, event }: Props = $props();

	let matches = $state(new Scouting.MatchScoutingExtendedArr([]));
	let canvas: HTMLCanvasElement;

	let c: MatchCanvas;

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Could not get 2d context');

		const res = Scouting.scoutingFromTeam(team.tba.team_number, event.tba.key);
		if (res.isOk()) {
			matches = res.value;
		} else {
			console.error('Failed to load scouting data:', res.error);
		}
		c = new MatchCanvas([], event.tba.year, ctx);

		const offMatches = matches.subscribe((matchesData) => {
			const array = matchesData
				.map((m) => m.data.trace)
				.filter(Boolean)
				// casted as string because sveltekit doesn't recognize filter(Boolean) as a type guard
				.map((t) => {
					const [first] = t.points;
					if (!first) return [];
					first[3] = 'blank' as Action;
					const firstPlacement = t.points.find((t) => !!t[3]); // first action that is not blank
					if (!firstPlacement) return first;
					return [first, firstPlacement];
				})
				.flat() as TraceArray;

			c.trace = array;
			c.reset();
			c.hidePath();
			c.init();
		});

		const stop = c.animate();

		return () => {
			stop();
			offMatches();
		};
	});
</script>

<div style="aspect-ratio: 2/1;" class="p-2">
	<canvas bind:this={canvas} style="height: 100%; width: 100%; object-fit: cover;"></canvas>
</div>
