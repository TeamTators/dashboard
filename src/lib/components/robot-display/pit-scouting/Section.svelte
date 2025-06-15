<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import type { TBAEvent, TBATeam } from 'tatorscout/tba';
	import Group from './Group.svelte';
	import { Account } from '$lib/model/account';

	interface Props {
		section: Scouting.PIT.SectionData;
		team: TBATeam;
		event: TBAEvent;
		groups: Scouting.PIT.GroupArr;
		questions: Scouting.PIT.QuestionArr;
		answers: Scouting.PIT.AnswerArr;
		answerAccounts: Account.AccountData[];
	}

	const { section, team, event, groups, questions, answers, answerAccounts }: Props = $props();
</script>

<div class="container-fluid">
	{#each $groups.filter((g) => g.data.sectionId === section.data.id) as group}
		<div class="row">
			<Group {group} {section} {team} {event} {questions} {answers} {answerAccounts} />
		</div>
	{/each}
</div>
