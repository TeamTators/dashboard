<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from '$lib/services/struct/data-arr';
	import { onMount } from 'svelte';
	import Section from './Section.svelte';
	import type { TBATeam, TBAEvent } from '$lib/utils/tba';
	import { Account } from '$lib/model/account';

	interface Props {
		team: TBATeam;
		event: TBAEvent;
		sections: {
			section: Scouting.PIT.SectionData;
			sessions: {
				session: Scouting.PIT.AnswerSessionsData;
				account: Account.AccountData | undefined;
				answers: {
					answer: Scouting.PIT.AnswerData;
					account: Account.AccountData | undefined;
				}[];
			}[];
		}[];
		groups: Scouting.PIT.GroupArr;
		questions: Scouting.PIT.QuestionArr;
	}

	const { team, event, sections, groups, questions }: Props = $props();
</script>

<div
	class="container-fluid"
	style="
	max-height: 100%;
	overflow-y: auto;
"
>
	{#if sections.length}
		{#each sections as section, i}
			{#if i > 0}
				<hr />
			{/if}
			<div class="row mb-3">
				<div class="d-flex justify-content-between align-items-center">
					<h6 class="mb-0">{section.section.data.name}</h6>
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
					section={section.section}
					team={team.tba}
					event={event.tba}
					{groups}
					{questions}
					sessions={section.sessions}
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
