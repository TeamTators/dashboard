<!--
@fileoverview Pit-scouting answer editor for a single question.

@component Question

@description
Renders the appropriate input control for the question type (text, number, boolean, checkbox,
radio, textarea, select), loads any existing answer for the team, and persists updates to the
answers struct when the user changes a value.

@example
```svelte
<Question {question} {team} {answers} />
```
-->
<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { Account } from '$lib/model/account';
	import { capitalize } from 'ts-utils/text';
	import { writable } from 'svelte/store';
	import type { DataArr } from '$lib/services/struct/data-arr';

	interface Props {
		/** Question definition being answered. */
		question: Scouting.PIT.QuestionData;
		/** Team number for which the answer is shown/edited. */
		team: number;
		/** Answer store for the current section. */
		answers: DataArr<typeof Scouting.PIT.Answers.data.structure>;
	}

	const { question, team, answers }: Props = $props();

	let answer: Scouting.PIT.AnswerData | undefined = $derived(
		answers.data.find((a) => a.data.questionId === question.data.id && a.data.team === team)
	);

	const value = writable<string[]>([]);
	let options: string[] = $state([]);
	let self = $state(Account.self);
	let disabled = $state(true);

	$effect(() => {
		const res = Scouting.PIT.parseOptions(question);
		if (res.isErr()) return console.error(res.error);
		options = res.value;
	});

	$effect(() => {
		if (!answer) {
			value.set([]);
			return;
		}
		const res = Scouting.PIT.parseAnswer(answer);
		if (res.isErr()) return console.error(res.error);
		value.set(res.value);
		self = Account.getSelf();
	});

	const retrieveAnswer = () => {
		if (answer) return;
		Scouting.PIT.Answers.get(
			{ questionId: question.data.id || '' },
			{
				type: 'all'
			}
		)
			.await()
			.then((res) => {
				if (res.isErr()) return console.error(res.error);
				const a = res.value.find((a) => a.data.team === team);
				if (a) {
					value.set([]);
					answer = a;
				}
			});
	};

	$effect(() => {
		if (!team) return; // trigger on team change
		retrieveAnswer();
	});

	const updateAnswer = async () => {
		if (answer) {
			answer.update((a) => ({
				...a,
				answer: JSON.stringify($value)
			}));
		} else {
			if (!question.data.id) return console.error('question.data.id did not exist');
			const accountId = self.data.data.id;
			if (!accountId) return console.error('No account id found');
			await Scouting.PIT.Answers.new({
				questionId: question.data.id,
				answer: JSON.stringify($value),
				team,
				accountId // Ideally, this would be done on the backend but it's okay to be a little insecure
			});
			// retrieveAnswer();
		}
		disabled = true;
	};
</script>

<div>
	<h5>{$question.question}</h5>
	<p class="text-muted mb-2">{$question.description}</p>
	<pre>{$question.key}</pre>
	<div class="d-flex justify-content-between">
		{#if $question.type === 'text'}
			<input
				type="text"
				class="form-control"
				placeholder="Enter a value..."
				value={$value[0] || ''}
				oninput={() => (disabled = false)}
				onchange={(e) => {
					value.set([e.currentTarget.value]);
					updateAnswer();
				}}
			/>
			<button type="button" class="ms-3 btn btn-success" {disabled}>
				<i class="material-icons">save</i>
			</button>
		{:else if $question.type === 'textarea'}
			<textarea
				class="form-control"
				placeholder="Enter a value... (long answer)"
				rows="3"
				oninput={() => (disabled = false)}
				onchange={(e) => {
					value.set([e.currentTarget.value]);
					updateAnswer();
				}}>{$value[0] || ''}</textarea
			>
			<button type="button" class="ms-3 btn btn-success" {disabled}>
				<i class="material-icons">save</i>
			</button>
		{:else if $question.type === 'number'}
			<input
				type="number"
				class="form-control"
				placeholder="Enter a number..."
				oninput={() => (disabled = false)}
				value={$value[0] || ''}
				onchange={(e) => {
					value.set([e.currentTarget.value]);
					updateAnswer();
				}}
			/>
			<button type="button" class="ms-3 btn btn-success" {disabled}>
				<i class="material-icons">save</i>
			</button>
		{:else if $question.type === 'boolean'}
			<input
				type="radio"
				id="{$question.id}-yes"
				class="btn-check"
				autocomplete="off"
				checked={$value.includes('yes')}
				onclick={() => {
					value.set(['yes']);
					updateAnswer();
				}}
			/>
			<label class="btn btn-outline-success" for="{$question.id}-yes">Yes</label>
			<input
				type="radio"
				id="{$question.id}-no"
				class="btn-check"
				autocomplete="off"
				checked={$value.includes('no')}
				onclick={() => {
					value.set(['no']);
					updateAnswer();
				}}
			/>
			<label class="btn btn-outline-danger" for="{$question.id}-no">No</label>
		{:else if $question.type === 'checkbox'}
			<p>
				<small class="text-muted"> Select one or more of the following options: </small>
			</p>
			{#each options as option}
				<input
					type="checkbox"
					id="{$question.id}-{option}"
					class="btn-check"
					autocomplete="off"
					checked={$value.includes(option)}
					onclick={() => {
						if ($value.includes(option)) {
							// value = value.filter((v) => v !== option);
							value.update((v) => v.filter((v) => v !== option));
						} else {
							// value = [...value, option];
							value.update((v) => [...v, option]);
						}
						updateAnswer();
					}}
				/>
				<label class="btn btn-outline-primary" for="{$question.id}-{option}"
					>{capitalize(option)}</label
				>
			{/each}
		{:else if $question.type === 'radio'}
			<p>
				<small class="text-muted"> Select one of the following options: </small>
			</p>
			{#each options as option}
				<input
					type="radio"
					id="{$question.id}-{option}"
					name={$question.id}
					class="btn-check"
					autocomplete="off"
					checked={$value.includes(option)}
					onclick={() => {
						// value = [option];
						value.set([option]);
						updateAnswer();
					}}
				/>
				<label class="btn btn-outline-primary" for="{$question.id}-{option}"
					>{capitalize(option)}</label
				>
			{/each}
		{:else if $question.type === 'select'}
			<select
				class="form-select"
				onchange={(e) => {
					// value = [e.currentTarget.value];
					value.set([e.currentTarget.value]);
					updateAnswer();
				}}
			>
				<option disabled selected>Select a Value...</option>
				{#each options as option}
					<option value={option} selected={$value.includes(option)}>{option}</option>
				{/each}
			</select>
		{/if}
	</div>
</div>
