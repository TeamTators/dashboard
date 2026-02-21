<!--
@fileoverview Read-only pit-scouting group renderer for a team.

@component Group

@description
Renders a group card and its list of questions for a specific team, delegating each question
to the `Question` component.

@example
```svelte
<Group {group} {team} {questions} {answers} />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from '$lib/services/struct/data-arr';
	import Question from './Question.svelte';

	interface Props {
		/** Group metadata being rendered. */
		group: Scouting.PIT.GroupData;
		/** Team number the answers belong to. */
		team: number;
		/** Questions belonging to this group. */
		questions: Scouting.PIT.QuestionData[];
		/** Answer store for this section/team. */
		answers: DataArr<typeof Scouting.PIT.Answers.data.structure>;
	}

	const { group, team, questions, answers }: Props = $props();
</script>

<div class="card layer-1">
	<div class="card-body">
		<div class="card-title">
			<div class="d-flex justify-content-between">
				<h3>{$group.name}</h3>
			</div>
		</div>
		{#each questions as question, i}
			{#if i > 0}
				<hr />
			{/if}
			<Question {question} {team} {answers} />
		{/each}
	</div>
</div>
