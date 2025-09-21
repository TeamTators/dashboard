<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import type { TBAEvent, TBATeam } from 'tatorscout/tba';
	import Group from './Group.svelte';
	import { Account } from '$lib/model/account';

	interface Props {
		section: Scouting.PIT.SectionData;
		team: TBATeam;
		event: TBAEvent;
		groups: Scouting.PIT.GroupArr;
		questions: Scouting.PIT.QuestionArr;
		sessions: {
			session: Scouting.PIT.AnswerSessionsData;
			account: Account.AccountData | undefined;
			answers: {
				answer: Scouting.PIT.AnswerData;
				account: Account.AccountData | undefined;
			}[];
		}[];
	}

	const { section, team, event, groups, questions, sessions }: Props = $props();
</script>

<div class="container-fluid">
	{#if $section.allowMultiple}
		{#each sessions as session, i}
			<div class="row">
				Submission {i + 1} ({session.account?.data.username || 'Unknown'})
			</div>
			{#each $groups.filter((g) => g.data.sectionId === section.data.id) as group}
				<div class="row">
					<Group {group} {section} {team} {event} {questions} answers={session.answers} />
				</div>
			{/each}
			{#if i < sessions.length - 1}
				<hr>
			{/if}
		{/each}
	{:else}
		{@const session = sessions[0]}
		{#if session}
			{#each $groups.filter((g) => g.data.sectionId === section.data.id) as group}
				<div class="row">
					<Group {group} {section} {team} {event} {questions} answers={session.answers} />
				</div>
			{/each}
		{/if}
	{/if}
</div>
