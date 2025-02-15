<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import type { TBAEvent, TBATeam } from 'tatorscout/tba';
	import Question from './Question.svelte';

	interface Props {
		group: Scouting.PIT.GroupData;
		section: Scouting.PIT.SectionData;
		team: TBATeam;
		event: TBAEvent;
	}

	const { group, section, team, event }: Props = $props();

	let questions = $state(new DataArr(Scouting.PIT.Questions, []));
	let answers = $state(new DataArr(Scouting.PIT.Answers, []));

	onMount(() => {
		questions = Scouting.PIT.Questions.fromProperty('groupId', String(group.data.id), false);
		answers = Scouting.PIT.Answers.fromProperty('team', team.team_number, false);
	});
</script>

<ul class="list-group">
	{#each $questions as question}
		<li class="list-group-item">
			<Question
				{question}
				{group}
				{section}
				{team}
				{event}
				answer={$answers.find((a) => a.data.questionId === question.data.id)}
			/>
		</li>
	{/each}
</ul>
