<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import type { TBAEvent, TBATeam } from 'tatorscout/tba';

	interface Props {
		question: Scouting.PIT.QuestionData;
		group: Scouting.PIT.GroupData;
		section: Scouting.PIT.SectionData;
		answer: Scouting.PIT.AnswerData | undefined;
		team: TBATeam;
		event: TBAEvent;
	}

	const { question, group, section, team, event, answer }: Props = $props();
</script>

<div class="w-100">
	<div class="w-50">
		{question.data.key}
	</div>
	<div class="w-50">
		{#if answer}
			<!-- TODO: answer is a string array json -->
			{answer.data.answer}
		{:else}
			No anser
		{/if}
	</div>
</div>
