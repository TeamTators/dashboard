<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import ArchivedComments from '$lib/components/robot-display/ArchivedComments.svelte';
	import { TBAEvent, TBATeam } from '$lib/utils/tba';
	import { Scouting } from '$lib/model/scouting';
	const { data } = $props();
	const event = $derived(new TBAEvent(data.event));
	const teams = $derived(data.teams.map((t) => new TBATeam(t, event)));
	const comments = $derived(data.comments.map(c=>Scouting.TeamComments.Generator(c)));
	const scouting = $derived(data.scouting);

	$effect(() => nav(event.tba));

    const getComments = (team: TBATeam) => {
        return comments.filter(c => c.data.team === team.tba.team_number);
    }
</script>

<div class="container-fluid">
	<div class="row mb-3">
		<h1>
			{event.tba.name} Archived Matches
		</h1>
	</div>
	
	{#each teams as team, i}
        {#if getComments(team).length}
            <div class="row mb-3">
                {#if i}
                    <hr />
                {/if}
                <div class="col-12">
                    <h3>{team.tba.team_number} {team.tba.nickname}</h3>
                </div>
                <ArchivedComments team={team.tba.team_number} event={event.tba.key} comments={getComments(team)} {scouting} />
            </div>
        {/if}
	{/each}
</div>
