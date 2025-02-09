<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import Group from './Group.svelte';
	import { prompt } from '$lib/utils/prompts';

	interface Props {
		section: Scouting.PIT.SectionData;
		team: number;
	}

	const { section, team }: Props = $props();

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
		<h3>{$section.name}</h3>
	</div>
	{#each $groups as group}
		<div class="row">
			<Group {group} {team} />
		</div>
	{/each}
</div>
