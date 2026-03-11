<!--
@fileoverview Read-only pit-scouting card that summarizes all sections.

@component PitScoutingCard

@description
Renders all pit-scouting sections for a team with links to edit each section. Uses
the provided questions and answers to display read-only responses.

@example
```svelte
<PitScoutingCard {team} {event} {sections} {groups} {questions} {answers} {answerAccounts} />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import Section from './Section.svelte';
	import type { TBATeam, TBAEvent } from '$lib/utils/tba';
	import { Account } from '$lib/model/account';

	interface Props {
		/** Team being displayed. */
		team: TBATeam;
		/** Event context for section links. */
		event: TBAEvent;
		/** Section store for the event. */
		sections: Scouting.PIT.SectionArr;
		/** Group store for the event. */
		groups: Scouting.PIT.GroupArr;
		/** Question store for the event. */
		questions: Scouting.PIT.QuestionArr;
		/** Answer store for the team. */
		answers: Scouting.PIT.AnswerArr;
		/** Accounts that provided answers. */
		answerAccounts: Account.AccountData[];
	}

	const { team, event, sections, groups, questions, answers, answerAccounts }: Props = $props();
</script>

<div
	class="container-fluid"
	style="
	max-height: 100%;
	overflow-y: auto;
"
>
	{#if $sections.length}
		{#each $sections as section, i}
			{#if i > 0}
				<hr />
			{/if}
			<div class="row mb-3">
				<div class="d-flex justify-content-between align-items-center">
					<h6 class="mb-0">{section.data.name}</h6>
					<a
						href="/dashboard/event/{event.tba.key}/pit-scouting/{i}/team/{team.tba.team_number}"
						class="btn"
					>
						<i class="material-icons">edit</i>
					</a>
				</div>
			</div>
			<div class="row mb-3">
				<Section
					{section}
					team={team.tba}
					event={event.tba}
					{groups}
					{questions}
					{answers}
					{answerAccounts}
				/>
			</div>
		{/each}
	{:else}
		<div class="row">
			<div class="col-12">
				<p>No sections found for event: {event.tba.name}</p>
			</div>
		</div>
	{/if}
</div>
