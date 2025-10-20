<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import type { BootstrapColor } from 'colors/color';
	import { Trace } from 'tatorscout/trace';
	import { YearInfo } from 'tatorscout/years';

	interface Props {
		scouting: Scouting.MatchScoutingData;
		classes?: string;
		yearInfo: YearInfo;
	}

	const { scouting, classes, yearInfo }: Props = $props();
	let actionObj: Record<string, number> = $state({});

	$effect(() => {
		try {
			const trace = Trace.parse(scouting.data.trace).unwrap();
			actionObj = trace.points.reduce(
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
			const arr = Object.keys(yearInfo.actions);
			return arr.indexOf(a) - arr.indexOf(b);
		}) as [action, count] (action)}
			<li class="list-group-item {classes}">
				{yearInfo.actions[action as keyof typeof yearInfo.actions]} - {count}
			</li>
		{/each}
	</ul>
	{#if !Object.keys(yearInfo.actions).length}
		<p class="text-muted text-center">No actions available.</p>
	{/if}
</div>
