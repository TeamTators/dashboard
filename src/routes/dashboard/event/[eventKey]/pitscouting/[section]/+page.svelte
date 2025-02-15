<!-- Team select -->
<!-- This, eventually, is where pit location will go -->
<script lang="ts">
	const { data } = $props();
	const { event, teams, section, eventKey } = data;
</script>

<div class="container">
	{#each teams as team}
		<a href="/dashboard/event/{eventKey}/pitscouting/{section}/team/{team.team_number}">
			<div class="row">
				<div class="card">
					{team.team_number} | {team.nickname}
				</div>
			</div>
		</a>
	{/each}
</div>
