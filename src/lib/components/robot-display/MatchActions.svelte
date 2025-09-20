<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import type { BootstrapColor } from 'colors/color';
	import { TraceSchema } from 'tatorscout/trace';
	import { actions } from 'tatorscout/trace';

	interface Props {
		scouting: Scouting.MatchScoutingData;
		classes?: string;
	}

	const { scouting, classes }: Props = $props();
	let actionObj: Record<string, number> = $state({});

	$effect(() => {
		try {
			const trace = TraceSchema.parse(JSON.parse(scouting.data.trace || '[]'));
			actionObj = trace.reduce(
				(acc, curr) => {
					if (!curr[3]) return acc;
					if (acc[curr[3]]) {
						acc[curr[3]] += 1;
					} else {
						acc[curr[3]] = 1;
					}
					return acc;
				},
				{} as Record<string, number>
			);
		} catch (error) {
			console.error(error);
		}
	});
</script>

<div>
	<h5 class="text-center">Actions</h5>
	<ul class="list-group {classes}">
		{#each Object.entries(actionObj).sort(([a], [b]) => {
			const arr = Object.keys(actions);
			return arr.indexOf(a) - arr.indexOf(b);
		}) as [action, count] (action)}
			<li class="list-group-item {classes}">
				{actions[action as keyof typeof actions]} - {count}
			</li>
		{/each}
	</ul>
	{#if !Object.keys(actions).length}
		<p class="text-muted text-center">No actions available.</p>
	{/if}
</div>
