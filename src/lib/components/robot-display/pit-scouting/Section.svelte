<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import type { TBAEvent, TBATeam } from 'tatorscout/tba';
	import Group from './Group.svelte';

	interface Props {
		section: Scouting.PIT.SectionData;
		team: TBATeam;
		event: TBAEvent;
	}

	const { section, team, event }: Props = $props();

	let groups = $state(new DataArr(Scouting.PIT.Groups, []));

	onMount(() => {
		groups = Scouting.PIT.Groups.fromProperty('sectionId', String(section.data.id), false);
	});
</script>

<div class="container-fluid">
	{#each $groups as group}
		<div class="row">
			<Group {group} {section} {team} {event} />
		</div>
	{/each}
</div>
