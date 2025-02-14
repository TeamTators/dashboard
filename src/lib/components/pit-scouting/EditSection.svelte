<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import EditGroup from './EditGroup.svelte';
	import { prompt } from '$lib/utils/prompts';

	interface Props {
		section: Scouting.PIT.SectionData;
	}

	const { section }: Props = $props();

	let groups = new DataArr(Scouting.PIT.Groups, []);

	onMount(() => {
		groups = Scouting.PIT.Groups.fromProperty('sectionId', $section.id || '', false);
		groups.sort((a, b) => Number(a.data.order) - Number(b.data.order));
	});

	const addGroup = async () => {
		const name = await prompt('Group Name');
		if (!name) return;
	};

	const changeName = async () => {
		const name = await prompt(`Change ${$section.name} to:`);
		if (!name) return;
		section.update((s) => ({
			...s,
			name
		}));
	};
</script>

<div class="container-fluid">
	<div class="row">
		<div class="d-flex justify-content-between">
			<h2>{$section.name}</h2>
			<button class="btn btn-primary" onclick={changeName}>
				<i class="material-icons"> edit </i>
			</button>
		</div>
	</div>
	<div class="row">
		<button class="btn btn-primary" onclick={addGroup}> Add Group </button>
	</div>
	{#each $groups as group}
		<div class="row">
			<EditGroup {group} />
		</div>
	{/each}
</div>
