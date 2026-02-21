<!--
@fileoverview Single potato stat progress bar.

@component Stat

@description
Displays a stat label with current value and max for the next phase, along with a thin
progress bar sized to the stat's percentage of the max.

@example
```svelte
<Stat name="Health" stat={42} level={100} color="red" />
```
-->
<script lang="ts">
	import { Potato } from '$lib/model/potato';

	interface Props {
		/** Stat label. */
		name: string;
		/** Current stat value. */
		stat: number;
		/** CSS color for the stat bar and label. */
		color: string;
		/** Current level used to compute the next phase max. */
		level: number;
	}

	const { name, stat, color, level }: Props = $props();

	const max = $derived(Potato.Levels[Potato.getNextPhase(level)]);
</script>

<div class="mb-2">
	<h6>{name} <small style="color: {color};">{stat} / {max}</small></h6>
	<div
		class="progress"
		role="progressbar"
		aria-label={name}
		aria-valuemin="0"
		aria-valuemax="100"
		aria-valuenow={stat}
		style="
        height: 1px;
    "
	>
		<div
			class="progress-bar"
			style="
            width: {(stat / max) * 100}%;
            background-color: {color};
        "
		></div>
	</div>
</div>
