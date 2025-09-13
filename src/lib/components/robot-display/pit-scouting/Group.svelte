<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import type { TBAEvent, TBATeam } from 'tatorscout/tba';
	import Question from './Question.svelte';
	import { Account } from '$lib/model/account';

	interface Props {
		group: Scouting.PIT.GroupData;
		section: Scouting.PIT.SectionData;
		team: TBATeam;
		event: TBAEvent;
		questions: Scouting.PIT.QuestionArr;
		answers: Scouting.PIT.AnswerArr;
		answerAccounts: Account.AccountData[];
	}

	const { group, section, team, event, questions, answers, answerAccounts }: Props = $props();
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
