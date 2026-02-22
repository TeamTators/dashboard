<script lang="ts">
	import Strategy from '$lib/components/strategy/Strategy.svelte';

	const { data } = $props();
	const event = $derived(data.event);
	const strategy = $derived(data.strategy);
	const teams = $derived(data.teams);
</script>

<Strategy {strategy} {event} {teams} />
