<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from '$lib/services/struct/data-arr';
	import { onMount } from 'svelte';
	import Group from './Group.svelte';

	interface Props {
		section: Scouting.PIT.SectionData;
		team: number;
		groups: Scouting.PIT.GroupData[];
		questions: DataArr<typeof Scouting.PIT.Questions.data.structure>;
		answers: DataArr<typeof Scouting.PIT.Answers.data.structure>;
	}

	const { section, team, groups, questions, answers }: Props = $props();

	$effect(() => {
		if (!section || !team) return; // trigger on section or team change
	});
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<h3>{$section.name}</h3>
		<hr />
	</div>
	{#each groups as group}
		<div class="row mb-3">
			<Group
				{group}
				{team}
				questions={$questions.filter((q) => q.data.groupId === group.data.id)}
				{answers}
			/>
		</div>
	{/each}
</div>
