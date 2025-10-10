<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import type { TBAEvent, TBATeam } from 'tatorscout/tba';
	import { capitalize } from 'ts-utils/text';
	import { Account } from '$lib/model/account';

	interface Props {
		question: Scouting.PIT.QuestionData;
		answer?: {
			answer: Scouting.PIT.AnswerData;
			account: Account.AccountData | undefined;
		};
	}

	const { question, answer }: Props = $props();

	let value = $state('No answer');
	let accountUsername = $state('unknown');

	onMount(() => {
		if (!answer) return;
		const res = Scouting.PIT.parseAnswer(answer.answer);
		if (res.isOk()) {
			value = res.value.join(', ');
			accountUsername = answer.account?.data.username || 'unknown';
		}

		import('bootstrap').then((bs) => {
			const _tt = bs.Tooltip.getOrCreateInstance(tooltip);
		});
	});

	let tooltip: HTMLDivElement;
</script>

<div class="d-flex justify-content-between">
	<div class="text-end">
		{capitalize($question.key || '')}
	</div>
	<div
		bind:this={tooltip}
		class="text-start"
		data-bs-toggle="tooltip"
		data-bs-title="Answered by {accountUsername}"
	>
		{value}
	</div>
</div>
