<!--
@fileoverview Read-only pit-scouting section renderer for robot display.

@component PitScoutingSection

@description
Filters groups for a section and renders each group with its questions and answers.

@example
```svelte
<Section {section} {team} {event} {groups} {questions} {answers} {answerAccounts} />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import type { TBAEvent, TBATeam } from 'tatorscout/tba';
	import Group from './Group.svelte';
	import { Account } from '$lib/model/account';

	interface Props {
		/** Section metadata being rendered. */
		section: Scouting.PIT.SectionData;
		/** Team context for answer lookup. */
		team: TBATeam;
		/** Event context for navigation. */
		event: TBAEvent;
		/** Group store for the event. */
		groups: Scouting.PIT.GroupArr;
		/** Question store for the event. */
		questions: Scouting.PIT.QuestionArr;
		/** Answer store for the team. */
		answers: Scouting.PIT.AnswerArr;
		/** Accounts that provided answers. */
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
