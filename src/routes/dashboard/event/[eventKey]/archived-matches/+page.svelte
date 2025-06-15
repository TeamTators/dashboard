<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import ArchivedMatches from '$lib/components/robot-display/ArchivedMatches.svelte';
	import { TBAEvent, TBATeam } from '$lib/utils/tba';
	const { data } = $props();
	const event = $derived(new TBAEvent(data.event));
	const teams = $derived(data.teams.map((t) => new TBATeam(t, event)));

	$effect(() => nav(event.tba));
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<h1>
			{event.tba.name} Archived Matches
		</h1>
	</div>
	{#each teams as team, i}
		<div class="row mb-3">
			{#if i}
				<hr />
			{/if}
			<div class="col-12">
				<h3>{team.tba.team_number} {team.tba.nickname}</h3>
			</div>
			<ArchivedMatches {team} {event} />
		</div>
	{/each}
</div>
