<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from '$lib/services/struct/data-arr';
	import { onMount } from 'svelte';
	import EditGroup from './EditGroup.svelte';
	import { prompt } from '$lib/utils/prompts';

	interface Props {
		section: Scouting.PIT.SectionData;
	}

	const { section }: Props = $props();

	let groups = $state(new DataArr(Scouting.PIT.Groups, []));

	const addGroup = async () => {
		const id = $section.id;
		if (!id) return console.error('No section id');
		const name = await prompt('Group Name');
		if (!name) return;

		await Scouting.PIT.Groups.new({
			name,
			sectionId: id,
			order: $groups.length
		});
	};

	const changeName = async () => {
		const name = await prompt(`Change ${$section.name} to:`, {
			default: $section.name
		});
		if (!name) return;
		section.update((s) => ({
			...s,
			name
		}));
	};

	onMount(() => {
		groups = Scouting.PIT.Groups.get(
			{ sectionId: $section.id || '' },
			{
				type: 'all'
			}
		);
		groups.sort((a, b) => Number(a.data.order) - Number(b.data.order));
	});
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<div class="d-flex justify-content-between">
			<h2>{$section.name}</h2>
			<button class="btn btn-primary" onclick={changeName}>
				<i class="material-icons"> edit </i>
			</button>
		</div>
	</div>
	{#each $groups as group}
		<div class="row mb-3">
			<EditGroup {group} />
		</div>
	{/each}
	<div class="row mb-3">
		<button class="btn btn-success" onclick={addGroup}>
			<i class="material-icons">add</i> Add Group
		</button>
	</div>
</div>
