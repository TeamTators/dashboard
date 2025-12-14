<script lang="ts">
	import type { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';

	interface Props {
		scouting: Scouting.MatchScoutingExtended;
		classes?: string;
	}

	const { scouting, classes }: Props = $props();
	let sliders: {
		[key: string]: {
			value: number;
			text: string;
			color: string;
		};
	} = $state({});

	const render = () => {
		const parsed = scouting.getSliders();
		if (parsed.isOk()) {
			sliders = parsed.value;
		} else {
			console.error('Failed to parse sliders', parsed.error);
		}
	};

	onMount(() => {
		render();

		return scouting.subscribe(render);
	});
</script>

<div class={classes}>
	<h5 class="text-center">Sliders</h5>
	<ul class="list">
		{#each Object.entries(sliders) as [key, slider]}
			<li class="list-item" style="color: {slider.color}">
				{key}: {slider.value} - {slider.text}
			</li>
		{/each}
	</ul>
</div>
