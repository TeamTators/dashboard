<!--
@fileoverview Slider summary list for a match scouting record.

@component Slider

@description
Parses slider values from the scouting record and renders each slider with its value and
text label.

@example
```svelte
<Slider {scouting} classes="list-group-flush" />
```
-->
<script lang="ts">
	import type { Scouting } from '$lib/model/scouting';

	interface Props {
		/** Match scouting record to parse sliders from. */
		scouting: Scouting.MatchScoutingExtended;
		/** Optional CSS classes for wrapper styling. */
		classes?: string;
	}

	const { scouting, classes }: Props = $props();
	let sliders = $derived(scouting.getSliders(true));
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
