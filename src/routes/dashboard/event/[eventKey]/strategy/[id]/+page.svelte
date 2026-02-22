<script lang="ts">
	import { page } from '$app/state';
	import { Strategy } from '$lib/model/strategy';
	import { alert } from '$lib/utils/prompts';
	import { onMount } from 'svelte';
	import S from '$lib/components/strategy/Strategy.svelte';
	import { TBAEvent, TBATeam } from '$lib/utils/tba';
	import nav from '$lib/nav/robot-display';
	import { tomorrow } from 'ts-utils';

	let strategy: Strategy.StrategyExtended | undefined = $state(undefined);
	let event: TBAEvent | undefined = $state(undefined);
	let teams: TBATeam[] = $state([]);
	onMount(() => {
		TBAEvent.getEvent(String(page.params.eventKey), false, tomorrow()).then(async (eventRes) => {
			if (eventRes.isOk()) {
				event = eventRes.value;
				nav(event.tba);
				const teamsRes = await event.getTeams(false, tomorrow());
				if (teamsRes.isErr()) {
					console.error(teamsRes.error);
					alert('Error loading strategy: Could not load the team data. Please try again later.');
					return;
				}
				teams = teamsRes.value;
				const matches = await event.getMatches(false, tomorrow());
				if (matches.isErr()) {
					console.error(matches.error);
					alert('Error loading strategy: Could not load the match data. Please try again later.');
					return;
				}
				const strategyRes = await Strategy.fromId(String(page.params.id), matches.value);
				if (strategyRes.isErr()) {
					console.error(strategyRes.error);
					alert(
						'Error loading strategy: Could not load the strategy data. Please try again later.'
					);
					return;
				}
				strategy = strategyRes.value;
			} else {
				console.error(eventRes.error);
				event = undefined;
				alert('Error loading strategy: Could not load the event data. Please try again later.');
			}
		});
	});
</script>

{#if strategy && event}
	<S {strategy} {event} {teams} />
{/if}
