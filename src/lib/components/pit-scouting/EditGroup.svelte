<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import EditQuestion from './EditQuestion.svelte';
	import { prompt } from '$lib/utils/prompts';

	interface Props {
		group: Scouting.PIT.GroupData;
	}

	const { group }: Props = $props();

	let questions = $state(new DataArr(Scouting.PIT.Questions, []));

	onMount(() => {
		questions = Scouting.PIT.Questions.fromProperty('groupId', $group.id || '', false);
	});

	const changeName = async () => {
		const name = await prompt(`Change ${$group.name} to:`);
		if (!name) return;
		group.update((g) => ({
			...g,
			name
		}));
	};
</script>

<div class="card">
	<div class="card-title">
		<div class="d-flex justify-content-between">
			<h3>{$group.name}</h3>
			<button class="btn btn-primary" onclick={changeName}>
				<i class="material-icons"> edit </i>
			</button>
		</div>
	</div>
	<div class="card-body">
		{#each $questions as question, index}
			<EditQuestion {question} {questions} {index} />
		{/each}
	</div>
</div>
