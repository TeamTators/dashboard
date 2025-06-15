<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import type { TBAEvent, TBATeam } from 'tatorscout/tba';
	import { capitalize } from 'ts-utils/text';
	import { Account } from '$lib/model/account';

	interface Props {
		question: Scouting.PIT.QuestionData;
		answer: Scouting.PIT.AnswerData | undefined;
		answerAccounts: Account.AccountData[];
	}

	const { question, answer, answerAccounts }: Props = $props();

	let value = $state('No answer');
	let accountUsername = $state('unknown');

	onMount(() => {
		if (!answer) return;
		const res = Scouting.PIT.parseAnswer(answer);
		if (res.isOk()) {
			value = res.value.join(', ');
			console.log(answerAccounts);
			const a = answerAccounts.find((a) => a.data.id === answer.data.accountId);
			accountUsername = a?.data.username || 'unknown';
		}

		import('bootstrap').then((bs) => {
			const tt = bs.Tooltip.getOrCreateInstance(tooltip);
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
