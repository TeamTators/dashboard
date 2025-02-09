<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { prompt } from '$lib/utils/prompts';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';

	interface Props {
		question: Scouting.PIT.QuestionData;
		questions: Scouting.PIT.QuestionArr;
		index: number;
	}

	const { question, questions, index }: Props = $props();

	let q = $state(question.data.question || '');
	let key = $state(question.data.key || '');
	let type = $state(question.data.type || 'text');
	let options: string[] = $state([]);
	let order = $state(question.data.order || 0);

	{
		const optionsData = Scouting.PIT.parseOptions(question);
		if (optionsData.isOk()) options = optionsData.value;
	}

	// question
	// key
	// type
	// options
	// order

	export const save = () => {
		question.update((data) => ({
			...data,
			question: q,
			key,
			type,
			order,
			options: JSON.stringify(Array.from(new Set(options)))
		}));
	};

	const addOption = async () => {
		const name = await prompt('Option Name');
		if (!name) return;
		options = Array.from(new Set([...options, name]));
		save();
	};
</script>

<div class="card">
	<div class="card-header">
		<button
			type="button"
			class="btn btn-secondary"
			disabled={index === 0}
			onclick={() => {
				order = order - 1;
				save();
			}}
		>
			<i class="material_icons">chevron_up</i>
		</button>
		<button
			type="button"
			class="btn btn-secondary"
			disabled={$questions.length === index - 1}
			onclick={() => {
				order = order + 1;
				save();
			}}
		>
			<i class="material_icons">chevron_down</i>
		</button>
	</div>
	<div class="card-body">
		<div class="input-group">
			<label for="question">Question</label>
			<input type="text" id="question" bind:value={q} class="form-control" onchange={save} />
		</div>
		<div class="input-group">
			<label for="key">Key</label>
			<input
				type="text"
				id="key"
				max="8"
				min="3"
				bind:value={key}
				class="form-control"
				onchange={save}
			/>
		</div>
		<div class="input-group">
			<label for="type">Type</label>
			<select id="type" bind:value={type} class="form-control" onchange={save}>
				<option value="text">Text</option>
				<option value="number">Number</option>
				<option value="boolean">Boolean</option>
				<option value="select">Select</option>
				<option value="radio">Radio</option>
				<option value="checkbox">Checkbox</option>
			</select>
		</div>
		{#if ['select', 'radio', 'checkbox'].includes(type)}
			<button class="btn btn-primary" onclick={addOption}>Add Option</button>
			{#each options as option, i}
				<div class="input-group">
					<button
						class="btn btn-outline-danger"
						type="button"
						disabled={i === 0}
						onclick={() => {
							options.splice(i, 1);
						}}
					>
						<i class="material-icons">delete</i>
					</button>
					<input
						type="text"
						value={option}
						class="form-control"
						onchange={(e) => {
							options[i] = e.currentTarget.value;
						}}
					/>
					<button
						type="button"
						class="btn btn-outline-secondary"
						onclick={() => {
							const prev = options[i - 1];
							options[i - 1] = option;
							options[i] = prev;
						}}
					>
						<i class="material-icons"> chevron_up </i>
					</button>
					<button
						type="button"
						class="btn btn-outline-secondary"
						disabled={i === options.length - 1}
						onclick={() => {
							const next = options[i + 1];
							options[i + 1] = option;
							options[i] = next;
						}}
					>
						<i class="material-icons"> chevron_up </i>
					</button>
				</div>
			{/each}
		{/if}
	</div>
</div>
