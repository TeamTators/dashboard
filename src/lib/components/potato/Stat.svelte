<script lang="ts">
	import { Potato } from '$lib/model/potato';

	interface Props {
		name: string;
		stat: number;
		color: string;
		level: number;
	}

	const { name, stat, color, level }: Props = $props();

	const max = Potato.Levels[Potato.getNextPhase(level)];
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
