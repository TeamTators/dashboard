<!-- Team select -->
<!-- This, eventually, is where pit location will go -->
<script lang="ts">
	import nav from '$lib/nav/robot-display.js';
	const { data } = $props();
	const teams = $derived(data.teams);
	const event = $derived(data.event);
	const eventKey = $derived(data.eventKey);
	const section = $derived(data.section);

	$effect(() => nav(event));
</script>

<div class="container">
	<div class="row">
		{#each teams as team}
			<div class="col-md-4 p-3">
				<a
					href="/dashboard/event/{eventKey}/pit-scouting/{section}/team/{team.team_number}"
					class="text-reset text-decoration-none"
				>
					<div class="card">
						<div class="card-body text-truncate">
							<h6 class="card-title">
								{team.team_number} | <span class="text-muted">{team.nickname}</span>
							</h6>
						</div>
					</div>
				</a>
			</div>
		{/each}
	</div>
</div>
