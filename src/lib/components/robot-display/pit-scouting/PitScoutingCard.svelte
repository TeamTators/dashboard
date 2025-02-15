<script lang="ts">
	import { Scouting } from '$lib/model/scouting';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import type { TBAEvent, TBATeam } from 'tatorscout/tba';
	import Section from './Section.svelte';

	interface Props {
		team: TBATeam;
		event: TBAEvent;
	}

	const { team, event }: Props = $props();

	let sections = $state(new DataArr(Scouting.PIT.Sections, []));

	onMount(() => {
		sections = Scouting.PIT.Sections.fromProperty('eventKey', event.key, false);
	});
</script>

<div class="container-fluid">
	{#if $sections.length}
		{#each $sections as section, i}
			<div class="row">
				<div class="col-12">
					{section.data.name}
					<a
						href="/dashboard/event/{event.key}/pitscouting/{i}/team/{team.team_number}"
						class="btn btn-primary"
					>
						<i class="material-icons">edit</i>
					</a>
				</div>
				<div class="col-12">
					<Section {section} {team} {event} />
				</div>
			</div>
		{/each}
	{:else}
		<div class="row">
			<div class="col-12">
				<p>No sections found for event: {event.name}</p>
			</div>
		</div>
	{/if}
</div>
