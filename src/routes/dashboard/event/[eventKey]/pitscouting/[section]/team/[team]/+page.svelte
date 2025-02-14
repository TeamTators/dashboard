<script lang="ts">
	import Section from '$lib/components/pit-scouting/Section.svelte';
	import { goto } from '$app/navigation';

	const { data } = $props();
	const { eventKey, section, sections, teams, team, sectionIndex } = data;
</script>

<div class="container">
	<div class="row">
		<h2>Pitscouting</h2>
	</div>
	<div class="row">
		<div class="card">
			<div class="card-body">
				<div class="no-scroll-y scroll-x ws-nowrap">
					{#each teams as t}
						<button
							onclick={() => {
								goto(
									`/dashboard/event/${eventKey}/pitscouting/${sectionIndex}/team/${t.team_number}`
								);
							}}
							class="btn btn-primary"
							disabled={t.team_number === team.team_number}
						>
							{t.team_number}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
	<div class="row">
		<div class="card">
			<div class="card-body">
				<div class="no-scroll-y scroll-x ws-nowrap">
					{#each sections as section, i}
						<button
							onclick={() => {
								goto(`/dashboard/event/${eventKey}/pitscouting/${i}/team/${team.team_number}`);
							}}
							class="btn btn-primary"
							disabled={sectionIndex === i}
						>
							{section.data.name}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
	<Section {section} team={team.team_number} />
</div>
