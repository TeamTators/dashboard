<!--
@fileoverview Pit-scouting section renderer for a team.

@component Section

@description
Displays a section header and renders all groups belonging to the section. Each group filters
questions by group ID and passes answers to the `Group` component.

@example
```svelte
<Section {section} {team} {groups} {questions} {answers} />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from '$lib/services/struct/data-arr';
	import Group from './Group.svelte';

	interface Props {
		/** Section metadata being rendered. */
		section: Scouting.PIT.SectionData;
		/** Team number for the section answers. */
		team: number;
		/** Groups belonging to the section. */
		groups: Scouting.PIT.GroupData[];
		/** Question store used to filter by group. */
		questions: DataArr<typeof Scouting.PIT.Questions.data.structure>;
		/** Answer store for the section/team. */
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
