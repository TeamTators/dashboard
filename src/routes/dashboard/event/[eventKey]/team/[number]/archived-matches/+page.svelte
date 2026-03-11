<!--
@component
Archived matches view for a single team at an event.

Renders the archived matches list for the selected team and ties into robot-display navigation.
-->
<script lang="ts">
	import nav from '$lib/nav/robot-display.js';
	import { TBAEvent, TBATeam } from '$lib/utils/tba.js';
	import ArchivedMatches from '$lib/components/robot-display/ArchivedMatches.svelte';

	const { data } = $props();
	const event = $derived(new TBAEvent(data.event));
	// const teams = $derived(data.teams.map((t) => new TBATeam(t, event)));
	const team = $derived(new TBATeam(data.team, event));
	$effect(() => nav(event.tba));
</script>

<ArchivedMatches {team} {event} />
