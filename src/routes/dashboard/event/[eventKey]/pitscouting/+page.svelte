<script lang="ts">
	import TeamSelect from '$lib/components/FIRST/TeamSelect.svelte';
	import { TBAEvent, TBATeam } from '$lib/utils/tba';
	import { onMount } from 'svelte';
	import { Scouting } from '$lib/model/scouting.js';
	import { DataArr } from 'drizzle-struct/front-end';
	import Section from '$lib/components/pit-scouting/Section.svelte';

	let selectedTeam: TBATeam | undefined = $state(undefined);
	let selectedSection: Scouting.PIT.SectionData | undefined = $state(undefined);

	const { data } = $props();
	const { eventKey } = data;

	let teams: TBATeam[] = $state([]);
	let sections = $state(new DataArr(Scouting.PIT.Sections, []));

	onMount(() => {
		TBAEvent.getEvent(eventKey).then(async (event) => {
			if (event.isErr()) return console.error(event.error);
			const res = await event.value.getTeams();
			if (res.isErr()) return console.error(res.error);
			teams = res.value;
		});

		sections = Scouting.PIT.Sections.fromProperty('eventKey', eventKey, false);
	});
</script>

<div class="container">
	<div class="row">
		<div class="col-md-4">
			<h2>Pitscouting</h2>
		</div>
		<div class="col-md-4">
			<TeamSelect {teams} bind:selected={selectedTeam} />
		</div>
		<div class="col-md-4">
			{#if $sections.length}
				<select
					onchange={(event) => {
						selectedSection = $sections.find((s) => s.data.id === event.currentTarget.value);
					}}
				>
					<option disabled>Select a Section</option>
					{#each $sections as section}
						<option value={section.data.id}>{section.data.name}</option>
					{/each}
				</select>
			{:else}
				<p>No Sections Found</p>
			{/if}
		</div>
	</div>

	{#if selectedTeam}
		{#each $sections as section}
			<Section {section} team={selectedTeam.tba.team_number} />
		{/each}
	{/if}
</div>
