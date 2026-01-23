<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from '$lib/services/struct/data-arr';
	import Question from './Question.svelte';

	interface Props {
		group: Scouting.PIT.GroupData;
		team: number;
		questions: Scouting.PIT.QuestionData[];
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
