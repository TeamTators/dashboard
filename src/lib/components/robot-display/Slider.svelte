<script lang="ts">
	import type { Scouting } from '$lib/model/scouting';
	import { WritableBase } from '$lib/utils/writables';
	import { onMount } from 'svelte';

	interface Props {
		scouting: Scouting.MatchScoutingExtended;
		classes?: string;
	}

	const { scouting, classes }: Props = $props();
	let sliders = $state(
		new WritableBase<{
			[key: string]: {
				value: number;
				text: string;
				color: string;
			};
		}>({})
	);

	onMount(() => {
		sliders = scouting.getSliders();
	});
</script>

<div class={classes}>
	<h5 class="text-center">Sliders</h5>
	<ul class="list">
		{#each Object.entries($sliders) as [key, slider]}
			<li class="list-item" style="color: {slider.color}">
				{key}: {slider.value} - {slider.text}
			</li>
		{/each}
	</ul>
</div>
