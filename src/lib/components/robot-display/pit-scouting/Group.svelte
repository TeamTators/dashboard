<!--
@fileoverview Read-only pit-scouting group renderer for robot display.

@component PitScoutingGroup

@description
Filters questions for a group and renders each as a read-only answer row.

@example
```svelte
<Group {group} {section} {team} {event} {questions} {answers} {answerAccounts} />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import type { TBAEvent, TBATeam } from 'tatorscout/tba';
	import Question from './Question.svelte';
	import { Account } from '$lib/model/account';

	interface Props {
		/** Group metadata being rendered. */
		group: Scouting.PIT.GroupData;
		/** Parent section metadata. */
		section: Scouting.PIT.SectionData;
		/** Team context for answer lookup. */
		team: TBATeam;
		/** Event context for navigation. */
		event: TBAEvent;
		/** Question store for the event. */
		questions: Scouting.PIT.QuestionArr;
		/** Answer store for the team. */
		answers: Scouting.PIT.AnswerArr;
		/** Accounts that provided answers. */
		answerAccounts: Account.AccountData[];
	}

	const { group, questions, answers, answerAccounts }: Props = $props();
</script>

<ul class="list-group border-0 layer-2">
	{#each $questions.filter((q) => q.data.groupId === group.data.id) as question}
		<li class="list-group-item border-0 layer-2">
			<Question
				{question}
				answer={$answers.find((a) => a.data.questionId === question.data.id)}
				{answerAccounts}
			/>
		</li>
	{/each}
</ul>
