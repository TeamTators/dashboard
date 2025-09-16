<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { prompt } from '$lib/utils/prompts';
	import { DataArr } from '$lib/services/struct/data-arr';
	import { onMount } from 'svelte';

	interface Props {
		question: Scouting.PIT.QuestionData;
	}

	const { question }: Props = $props();

	let q = $state(question.data.question || '');
	let description = $state(question.data.description || '');
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
			key: key.toLowerCase().trim().replace(/ /g, '_'),
			type,
			order,
			options: JSON.stringify(Array.from(new Set(options))),
			description
		}));
	};

	const addOption = async () => {
		const name = await prompt('Option Name');
		if (!name) return;
		options = Array.from(new Set([...options, name]));
		save();
	};
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<div class="input-group">
			<span class="input-group-text">Question</span>
			<input type="text" bind:value={q} class="form-control" onchange={save} />
		</div>
	</div>
	<div class="row mb-3">
		<div class="input-group">
			<span class="input-group-text">Description</span>
			<input type="text" bind:value={description} class="form-control" onchange={save} />
		</div>
	</div>
	<div class="row mb-3">
		<div class="input-group">
			<span class="input-group-text">Key</span>
			<input type="text" max="8" min="3" bind:value={key} class="form-control" onchange={save} />
		</div>
	</div>
	<div class="row mb-3">
		<div class="input-group">
			<span class="input-group-text">Type</span>
			<select id="type" bind:value={type} class="form-control" onchange={save}>
				<option value="text">Text</option>
				<option value="number">Number</option>
				<option value="boolean">Boolean</option>
				<option value="select">Select</option>
				<option value="radio">Radio</option>
				<option value="checkbox">Checkbox</option>
				<option value="textarea">Textarea</option>
			</select>
		</div>
	</div>
	<div class="row mb-3">
		{#if ['select', 'radio', 'checkbox'].includes(type)}
			{#each options as option, i}
				<div class="input-group mb-3">
					<button
						class="btn btn-outline-danger"
						type="button"
						onclick={() => {
							options.splice(i, 1);
							save();
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
							save();
						}}
					/>
					<button
						type="button"
						class="btn btn-outline-secondary btn-sm"
						onclick={() => {
							if (i === 0) return;
							const prev = options[i - 1];
							options[i - 1] = option;
							options[i] = prev;
							save();
						}}
					>
						<i class="material-icons"> keyboard_arrow_up </i>
					</button>
					<button
						type="button"
						class="btn btn-outline-secondary btn-sm"
						onclick={() => {
							if (i === options.length - 1) return;
							const next = options[i + 1];
							options[i + 1] = option;
							options[i] = next;
							save();
						}}
					>
						<i class="material-icons"> keyboard_arrow_down </i>
					</button>
				</div>
			{/each}
			<div class="d-flex justify-content-center">
				<button class="btn btn-primary w-50 btn-sm" onclick={addOption}
					><i class="material-icons">add</i> Add Option</button
				>
			</div>
		{/if}
	</div>
</div>
