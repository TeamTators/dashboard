<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import { type TraceArray } from 'tatorscout/trace';
	import { MatchCanvas } from '$lib/model/match-canvas';
	import { type Focus } from '$lib/types/robot-display';
	import type { TBAEvent, TBATeam } from '$lib/utils/tba';

	interface Props {
		team: TBATeam;
		focus: Focus;
		event: TBAEvent;
	}

	let actions: string[] = $state([]);

	export const getActions = () => actions;

	const { team, focus, event }: Props = $props();

	let matches: Scouting.MatchScoutingExtendedArr = $state(
		new Scouting.MatchScoutingExtendedArr([])
	);
	let canvas: HTMLCanvasElement;

	let c: MatchCanvas;
	let array: TraceArray = $state([]);

	$effect(() => {});

	$effect(() => {
		if (!c) return;
		c.between(0, array.length);
	});

	$effect(() => {
		array = matches.data
			.map((m) => m.data.trace)
			.filter(Boolean)
			// casted as string because sveltekit doesn't recognize filter(Boolean) as a type guard
			.map((t) => {
				return t.points.filter((p) => {
					const [i, , , a] = p;
					if (!a) return false;
					if (!actions.includes(a)) {
						actions.push(a);
					}
					if (focus.auto) return i < 20 * 4;
					if (focus.teleop) return i >= 20 * 4 && i < 20 * 4 + 135 * 4;
					if (focus.endgame) return i >= 20 * 4 + 135 * 4;
					return false;
				}) as TraceArray;
			})
			.flat();
	});

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Could not get 2d context');

		matches = Scouting.scoutingFromTeam(team.tba.team_number, event.tba.key).unwrap();

		c = new MatchCanvas(array, event.tba.year, ctx);

		c.hidePath();

		actions = [];

		return c.animate();
	});
</script>

<div style="height: 100%; width: 100%; object-fit: cover;" class="p-2">
	<canvas bind:this={canvas} style="height: 100%; width: 100%; object-fit: cover;"></canvas>
</div>
