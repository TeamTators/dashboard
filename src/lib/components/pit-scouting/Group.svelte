<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import Question from './Question.svelte';

	interface Props {
		group: Scouting.PIT.GroupData;
		team: number;
	}

	const { group, team }: Props = $props();

	let questions = $state(new DataArr(Scouting.PIT.Questions, []));
	let answers = $state(new DataArr(Scouting.PIT.Answers, []));

	let questionIds: string[] = $state([]);

	$effect(() => {
		questionIds = Array.from(new Set(questions.data.map((q) => String(q.data.id))));
	});

	onMount(() => {
		questions = Scouting.PIT.Questions.fromProperty('groupId', $group.id || '', false);
		answers = Scouting.PIT.getAnswersFromGroup(group, questionIds);
	});
</script>

<div class="card">
	<div class="card-title">
		<div class="d-flex justify-content-between">
			<h3>{$group.name}</h3>
		</div>
	</div>
	<div class="card-body">
		{#each $questions as question}
			<Question {question} {answers} {team} />
		{/each}
	</div>
</div>
