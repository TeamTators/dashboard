<script lang="ts">
	import Card from '$lib/components/dashboard/Card.svelte';
	import { Dashboard } from '$lib/model/dashboard';
	import DB from '$lib/components/dashboard/Dashboard.svelte';
	const { data = $bindable() } = $props();
	const event = $derived(data.event);
	const teams = $derived(data.teams);
	const matches = $derived(data.matches);

	const dashboard = $derived(
		new Dashboard.Dashboard({
			name: event.name,
			cards: [],
			id: 'event-dashboard'
		})
	);
</script>

<DB {dashboard}>
	{#snippet body()}
		<div style="grid-column: span var(--grid-size);">
			<div class="ws-nowrap scroll-x p-3">
				{#each teams as team}
					<a
						href="/dashboard/event/{event.key}/team/{team.team_number}"
						type="button"
						class="btn btn-primary mx-2"
					>
						{team.team_number}
					</a>
				{/each}
			</div>
		</div>
	{/snippet}
</DB>
