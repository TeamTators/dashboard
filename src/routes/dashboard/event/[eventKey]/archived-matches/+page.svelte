<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import ArchivedMatches from '$lib/components/robot-display/ArchivedMatches.svelte';
	import ArchivedComments from '$lib/components/robot-display/ArchivedComments.svelte';
	import { TBAEvent, TBATeam } from '$lib/utils/tba';
	import { Scouting } from '$lib/model/scouting';
	const { data } = $props();
	const event = $derived(new TBAEvent(data.event));
	const teams = $derived(data.teams.map((t) => new TBATeam(t, event)));
	const comments = $derived(data.comments.map((c) => Scouting.TeamComments.Generator(c)));
	const scouting = $derived(data.comments.map((c) => Scouting.MatchScouting.Generator(c)));

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
			<ArchivedComments
				team={team.tba.team_number}
				event={event.tba.key}
				comments={comments.filter((c) => c.data.team === team.tba.team_number)}
				{scouting}
			/>
		</div>
	{/each}
</div>
