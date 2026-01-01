<script lang="ts">
	import { MatchHTML } from '$lib/model/match-html';
	import type { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import rangeSlider from 'range-slider-input';
	import type { Readable } from 'svelte/store';

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

		const s = rangeSlider(slider, {
			max: trace.match.trace.points.length,
			step: 1,
			min: 0,
			value: [0, trace.match.trace.points.length],
			onInput: ([from, to]) => {
				trace.from = from;
				trace.to = to;
				trace.render();
			}
		});

		return focus?.subscribe((f) => {
			switch (f) {
				case 'auto':
					s.value([0, 15 * 4]);
					break;
				case 'teleop':
					s.value([15 * 4, 15 * 4 + 135 * 4]);
					break;
				case 'endgame':
					s.value([15 * 4 + 100 * 4, trace.match.trace.points.length]);
					break;
				case 'all':
					s.value([0, trace.match.trace.points.length]);
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
