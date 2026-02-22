<script lang="ts">
	import { page } from "$app/state";
	import { Strategy } from "$lib/model/strategy";
	import { alert } from "$lib/utils/prompts";
	import { onMount } from "svelte";
	import S from "$lib/components/strategy/Strategy.svelte";
	import { TBAEvent } from "$lib/utils/tba";
    import nav from '$lib/nav/robot-display';
	import { tomorrow } from "ts-utils";

	let strategy: Strategy.StrategyExtended | undefined = $state(undefined);
	let event: TBAEvent | undefined = $state(undefined);

	onMount(() => {
		TBAEvent.getEvent(String(page.params.eventKey), false, tomorrow()).then(res => {
			console.log('Event data:', res);
			if (res.isOk()) {
				event = res.value;
				nav(event.tba);
			} else {
				console.error(res.error);
				event = undefined;
				alert("Error loading strategy: Could not load the event data. Please try again later.");
			}
		});

		Strategy.fromId(String(page.params.id)).then(res => {
			console.log('Strategy data:', res);
			if (res.isOk()) {
				strategy = res.value;
			} else {
				console.error(res.error);
				strategy = undefined;
				alert("Error loading strategy: Could not load the strategy. Please try again later.");
			}
		});
	});
</script>

{#if strategy && event}
	<S {strategy} event={event} />
{/if}