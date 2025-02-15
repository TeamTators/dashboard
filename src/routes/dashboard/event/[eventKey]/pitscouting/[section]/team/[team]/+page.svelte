<script lang="ts">
	import Section from '$lib/components/pit-scouting/Section.svelte';
	import { afterNavigate, goto } from '$app/navigation';
	import { sleep } from 'ts-utils/sleep';

	const { data } = $props();
	const { eventKey, section, sections, teams, team, sectionIndex } = data;

	let scroller: HTMLDivElement;

	afterNavigate(() => {
		const btn = scroller.querySelector(`[data-team="${team.team_number}"]`);
		if (btn) {
			sleep(500).then(() =>
				btn.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest',
					inline: 'center'
				})
			);
		}
	});
</script>

<div class="container">
	<div class="row">
		<h2>Pitscouting</h2>
	</div>
	<div class="row">
		<div class="ws-nowrap scroll-x p-3 mb-3" bind:this={scroller}>
			{#each teams as t}
				<a
					type="button"
					href="/dashboard/event/{eventKey}/pitscouting/{sectionIndex}/team/{t.team_number}"
					class="btn mx-2"
					class:btn-primary={t.team_number !== team.team_number}
					class:btn-outline-secondary={t.team_number === team.team_number}
					class:btn-disabled={t.team_number === team.team_number}
					class:text-muted={t.team_number === team.team_number}
					onclick={(e) => {
						if (t.team_number === team.team_number) {
							return e.preventDefault();
						}
					}}
					data-team={t.team_number}
				>
					{t.team_number}
				</a>
			{/each}
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
