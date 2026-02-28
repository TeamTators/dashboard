<script lang="ts">
	import Strategy from '$lib/components/strategy/Strategy.svelte';
	import nav from '$lib/nav/robot-display.js';

	const { data } = $props();
	const event = $derived(data.event);
	const strategy = $derived(data.strategy);
	const teams = $derived(data.teams);

	$effect(() => nav(event.tba));
</script>

<Strategy {strategy} {event} {teams} />
