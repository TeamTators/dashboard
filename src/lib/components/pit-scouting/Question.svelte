<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import { Account } from '$lib/model/account';

	interface Props {
		question: Scouting.PIT.QuestionData;
		answers: Scouting.PIT.AnswerArr;
		team: number;
	}

	const { question, answers, team }: Props = $props();

	let answer = $answers.find((a) => a.data.questionId === question.data.id);

	let value: string[] = $state([]);
	let options: string[] = $state([]);
	let self = $state(Account.self);

	$effect(() => {
		const res = Scouting.PIT.parseOptions(question);
		if (res.isErr()) return console.error(res.error);
		options = res.value;
	});

	$effect(() => {
		if (!answer) return;
		const res = Scouting.PIT.parseAnswer(answer);
		if (res.isErr()) return console.error(res.error);
		value = res.value;
		self = Account.getSelf();
	});

	const updateAnswer = () => {
		if (answer) {
			answer.update((a) => ({
				...a,
				value: JSON.stringify(value)
			}));
		} else {
			if (!question.data.id) return console.error('question.data.id did not exist');
			const accountId = self.get().data.id;
			if (!accountId) return console.error('No account id found');
			Scouting.PIT.Answers.new({
				questionId: question.data.id,
				answer: JSON.stringify(value),
				team,
				accountId // Ideally, this would be done on the backend but it's okay to be a little insecure
			});
		}
	};
</script>

<div class="card">
	<div class="card-body">
		<label for="">{$question.question}</label>

		{#if $question.type === 'text'}
			<input
				type="text"
				value={value[0] || ''}
				onchange={(e) => {
					value = [e.currentTarget.value];
					updateAnswer();
				}}
			/>
		{:else if $question.type === 'number'}
			<input
				type="number"
				value={value[0] || ''}
				onchange={(e) => {
					value = [e.currentTarget.value];
					updateAnswer();
				}}
			/>
		{:else if $question.type === 'boolean'}
			<label>
				<input
					type="radio"
					name="boolean"
					value="yes"
					checked={value[0] === 'yes'}
					onchange={() => {
						value = ['yes'];
						updateAnswer();
					}}
				/>
				Yes
			</label>
			<label>
				<input
					type="radio"
					name="boolean"
					value="no"
					checked={value[0] === 'no'}
					onchange={() => {
						value = ['no'];
						updateAnswer();
					}}
				/>
				No
			</label>
		{:else if $question.type === 'checkboxes'}
			{#each options as option}
				<label>
					<input
						type="checkbox"
						value={option}
						checked={value.includes(option)}
						onchange={(e) => {
							if (e.currentTarget.checked) {
								value = [...value, option];
							} else {
								value = value.filter((v) => v !== option);
							}
							updateAnswer();
						}}
					/>
					{option}
				</label>
			{/each}
		{:else if $question.type === 'radios'}
			{#each options as option}
				<label>
					<input
						type="radio"
						name="radios"
						value={option}
						checked={value[0] === option}
						onchange={() => {
							value = [option];
							updateAnswer();
						}}
					/>
					{option}
				</label>
			{/each}
		{:else if $question.type === 'select'}
			<select
				onchange={(e) => {
					value = [e.currentTarget.value];
					updateAnswer();
				}}
			>
				<option disabled selected>Select a Value...</option>
				{#each options as option}
					<option value={option} selected={value[0] === option}>{option}</option>
				{/each}
			</select>
		{/if}
	</div>
</div>
