<script lang="ts">
	import { MatchHTML } from '$lib/model/match-html';
	import type { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import type { Readable } from 'svelte/store';
	import { RangeSlider } from '$lib/utils/form';

	interface Props {
		scouting: Scouting.MatchScoutingExtended;
		focus?: Readable<'auto' | 'teleop' | 'endgame' | 'all'>;
	}

	const { scouting, focus }: Props = $props();

	let target: HTMLDivElement;
	let slider: HTMLDivElement;

	const trace: MatchHTML = $derived(new MatchHTML(scouting));

	onMount(() => {
		trace.init(target);
		trace.animate();

		// const s = rangeSlider(slider, {
		// 	max: trace.match.trace.points.length,
		// 	step: 1,
		// 	min: 0,
		// 	value: [0, trace.match.trace.points.length],
		// 	onInput: ([from, to]) => {
		// 		trace.from = from;
		// 		trace.to = to;
		// 		trace.render();
		// 	}
		// });

		const s = new RangeSlider({
			target: slider,
			min: 0,
			max: trace.match.trace.points.length,
			step: 1
		});

		return focus?.subscribe((f) => {
			switch (f) {
				case 'auto':
					s.set({ min: 0, max: 15 * 4 + 3 * 4 });
					break;
				case 'teleop':
					s.set({ min: 15 * 4 + 3 * 4, max: 15 * 4 + 100 * 4 });
					break;
				case 'endgame':
					s.set({ min: 15 * 4 + 100 * 4, max: trace.match.trace.points.length });
					break;
				case 'all':
					s.set({ min: 0, max: trace.match.trace.points.length });
					break;
			}
		});
	});
</script>

<div class="card">
	<div class="card-body py-3 px-1">
		<div bind:this={target}></div>
		<div bind:this={slider} class="mt-3"></div>
	</div>
</div>
