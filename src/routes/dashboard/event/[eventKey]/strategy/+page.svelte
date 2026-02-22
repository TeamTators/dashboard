<script lang="ts">
	import { page } from '$app/state';
	import { Strategy } from '$lib/model/strategy';
	import StrategyGrid from '$lib/components/strategy/StrategyGrid.svelte';
	import { alert, prompt, select } from '$lib/utils/prompts';
	import { teamsFromMatch } from 'tatorscout/tba';
	import { goto } from '$app/navigation';
	const { data } = $props();
	const strategies = $derived(data.strategies);
	const matches = $derived(data.matches);
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
					alliance: teams.indexOf(2122) < 3 ? 'red' : 'blue'
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
