<script lang="ts">
	import { page } from '$app/state';
	import { Strategy } from '$lib/model/strategy';
	import { onMount } from 'svelte';
	import nav from '$lib/nav/robot-display.js';
	import { TBAEvent, TBAMatch } from '$lib/utils/tba';
	import { tomorrow } from 'ts-utils';
	import StrategyGrid from '$lib/components/strategy/StrategyGrid.svelte';
	import { alert, prompt, select } from '$lib/utils/prompts';
	import { teamsFromMatch } from 'tatorscout/tba';
	import { goto } from '$app/navigation';

	let strategies = $state(Strategy.Strategy.arr());
	let matches: TBAMatch[] = $state([]);

	onMount(() => {
		strategies = Strategy.Strategy.get(
			{
				eventKey: String(page.params.eventKey)
			},
			{
				type: 'all'
			}
		);

		TBAEvent.getEvent(String(page.params.eventKey), false, tomorrow()).then(async (res) => {
			if (res.isOk()) {
				nav(res.value.tba);
				const matchesRes = await res.value.getMatches(false, tomorrow());
				if (matchesRes.isOk()) {
					matches = matchesRes.value;
				} else {
					console.error(matchesRes.error);
					alert('Error loading strategies: Could not load the match data. Please try again later.');
				}
			}
		});
	});
</script>

<div class="container">
	<div class="row mb-3">
		<div class="col">
			<h1>Strategies</h1>
		</div>
		<a href={`/dashboard/event/${page.params.eventKey}/matches`} class="btn btn-outline-primary">
			View All Matches
		</a>
		<button
			type="button"
			class="btn btn-primary"
			onclick={async () => {
				const match = await select(
					'Select Match',
					matches.filter((m) => teamsFromMatch(m.tba).includes(2122)),
					{
						render: (match) => `${match.tba.comp_level}${match.tba.match_number}`,
						title: 'Select Match for New Strategy'
					}
				);
				if (!match) return;

				const name = await prompt('Enter strategy name');
				if (!name) return;
				const teams = teamsFromMatch(match.tba);

				const strategy = await Strategy.create({
					match,
					name,
					alliance: teams.indexOf(2122) < 2 ? 'red' : 'blue'
				});
				if (strategy.isErr()) {
					console.error(strategy.error);
					alert('Error creating strategy: Could not create the strategy. Please try again later.');
					return;
				}

				goto(`/dashboard/event/${page.params.eventKey}/strategy/${strategy.value.data.id}`);
			}}
		>
			Create New Strategy
		</button>
	</div>
	<div class="row mb-3">
		<div class="col">
			{#key strategies}
				<StrategyGrid {strategies} />
			{/key}
		</div>
	</div>
</div>
