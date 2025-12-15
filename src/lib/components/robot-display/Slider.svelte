<script lang="ts">
	import type { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import { z } from 'zod';

	interface Props {
		scouting: Scouting.MatchScoutingData;
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
		const parsed = z
			.record(
				z.string(),
				z.object({
					value: z.number(),
					text: z.string(),
					color: z.string().default('#000000')
				})
			)
			.safeParse(JSON.parse(String(scouting.data.sliders)));
		if (parsed.success) {
			sliders = parsed.data;
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
