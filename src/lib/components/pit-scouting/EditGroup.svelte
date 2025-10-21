<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from '$lib/services/struct/data-arr';
	import { onMount } from 'svelte';
	import EditQuestion from './EditQuestion.svelte';
	import { confirm, prompt, select } from '$lib/utils/prompts';

	interface Props {
		group: Scouting.PIT.GroupData;
	}

	const { group }: Props = $props();

	let questions = $state(new DataArr(Scouting.PIT.Questions, []));

	const changeName = async () => {
		const name = await prompt(`Change ${$group.name} to:`, {
			default: $group.name
		});
		if (!name) return;
		group.update((g) => ({
			...g,
			name
		}));
	};

	const addQuestion = async () => {
		const id = $group.id;
		if (!id) return console.error('No group id');
		Scouting.PIT.Questions.new({
			question: 'New Question',
			type: 'text',
			key: `q${$questions.length}`,
			order: $questions.length,
			options: '[]',
			groupId: id,
			description: 'Description'
		});
	};

	onMount(() => {
		questions = Scouting.PIT.Questions.fromProperty('groupId', $group.id || '', {
			type: 'all'
		});
		questions.sort((a, b) => Number(a.data.order) - Number(b.data.order));
	});
</script>

<div class="card p-0 layer-1">
	<div class="card-header">
		<div class="d-flex justify-content-between">
			<h3 class="card-title">{$group.name}</h3>
			<div class="btn-group" role="group">
				<button type="button" class="btn btn-primary" onclick={changeName}>
					<i class="material-icons"> edit </i>
				</button>
				<button
					type="button"
					class="btn btn-danger"
					onclick={async () => {
						const res = await confirm('Are you sure you want to archive this group?');
						if (!res) return;
						if ($questions.filter((q) => !q.data.canUpdate).length) {
							const res = await confirm(
								'It looks as though there are questions in this group that are not supposed to be updated or deleted. Are you sure you want to archive this group? This may cause issues with other parts of the app.'
							);
							if (!res) return;
						}
						group.setArchive(true);
					}}
				>
					<i class="material-icons"> archive </i>
				</button>
			</div>
		</div>
	</div>
	<div class="card-body">
		<div class="container-fluid">
			{#each $questions as question, index}
				<div class="row mb-3">
					<div class="d-flex justify-content-between">
						<h5>Question {index + 1}:</h5>

						<div class="btn-group" role="group">
							<button
								type="button"
								class="btn btn-secondary"
								onclick={() => {
									const prev = $questions[index - 1];
									if (!prev) return;
									question.update((q) => ({
										...q,
										order: prev.data.order
									}));
									prev.update((q) => ({
										...q,
										order: question.data.order
									}));
								}}
							>
								<i class="material-icons"> keyboard_arrow_up </i>
							</button>
							<button
								type="button"
								class="btn btn-secondary"
								onclick={() => {
									const next = $questions[index + 1];
									if (!next) return;
									question.update((q) => ({
										...q,
										order: next.data.order
									}));
									next.update((q) => ({
										...q,
										order: question.data.order
									}));
								}}
							>
								<i class="material-icons"> keyboard_arrow_down </i>
							</button>
							<button
								type="button"
								class="btn btn-danger btn-sm"
								onclick={async () => {
									const res = await confirm('Are you sure you want to archive this question?');
									if (!res) return;
									if (!question.data.canUpdate) {
										const res = await confirm(
											'This question is not supposed to be updated or deleted. Are you sure you want to archive this question? This may cause issues with other parts of the app.'
										);
										if (!res) return;
									}
									question.setArchive(true);
								}}
							>
								<i class="material-icons"> archive </i>
							</button>
						</div>
					</div>
					<EditQuestion {question} />
					<hr />
				</div>
			{/each}
			<div class="row">
				<button class="btn btn-secondary" onclick={addQuestion}>
					<i class="material-icons">add</i>
					Add Question
				</button>
			</div>
		</div>
	</div>
</div>
