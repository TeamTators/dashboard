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
	// let answers = $state(new DataArr(Scouting.PIT.Answers, []));

	let questionIds: string[] = $state([]);

	$effect(() => {
		questionIds = Array.from(new Set(questions.data.map((q) => String(q.data.id))));
	});

	onMount(() => {
		questions = Scouting.PIT.Questions.fromProperty('groupId', $group.id || '', false);
		questions.sort((a, b) => Number(a.data.order) - Number(b.data.order));
		// answers = Scouting.PIT.getAnswersFromGroup(group, questionIds);
	});
</script>

<div class="card">
	<div class="card-body">
		<div class="card-title">
			<div class="d-flex justify-content-between">
				<h3>{$group.name}</h3>
			</div>
		</div>
		{#each $questions as question, i}
			{#if i > 0}
				<hr />
			{/if}
			<Question {question} {team} />
		{/each}
	</div>
</div>
