<script lang="ts">
	import nav from '$lib/nav/robot-display.js';
	import { Scouting } from '$lib/model/scouting.js';
	import { DataArr } from '$lib/services/struct/data-arr';
	import { TBAEvent, TBAMatch } from '$lib/utils/tba.js';
	import { onMount } from 'svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import { dateTime } from 'ts-utils/clock';
	import { Strategy } from '$lib/model/strategy.js';
	import Modal from '$lib/components/bootstrap/Modal.svelte';
	import StrategyGrid from '$lib/components/strategy/StrategyGrid.svelte';
	import { prompt } from '$lib/utils/prompts.js';
	import { goto } from '$app/navigation';

	const { data } = $props();

	let matches: TBAMatch[] = $state([]);

	const event = $derived(new TBAEvent(data.event));
	const matchScouting = $derived(new DataArr(Scouting.MatchScouting, data.scouting));
	let strategies = $state(Strategy.Strategy.arr());

	let selectedMatches: TBAMatch[] = $state([]);

	$effect(() => nav(event.tba));

	const team = (teamKey: string) => {
		return Number(teamKey.substring(3));
	};

	const inSelected = (teamKey: string, scouted: boolean) => {
		for (const match of selectedMatches) {
			if (
				match.tba.alliances.red.team_keys.includes(teamKey) ||
				match.tba.alliances.blue.team_keys.includes(teamKey)
			) {
				if (scouted) {
					return 'highlight-muted';
				}
				return 'highlight';
			}
		}
		return '';
	};

	const findMatch = (
		match: TBAMatch,
		matchScouting: Scouting.MatchScoutingData[],
		team: number
	) => {
		return matchScouting.find(
			(m) =>
				m.data.matchNumber === match.tba.match_number &&
				m.data.compLevel === match.tba.comp_level &&
				m.data.team === team
		);
	};

	const has2122 = (match: TBAMatch) => {
		return (
			match.tba.alliances.red.team_keys.includes('frc2122') ||
			match.tba.alliances.blue.team_keys.includes('frc2122')
		);
	};

	onMount(() => {
		const add = (scouting: Scouting.MatchScoutingData) => {
			if (scouting.data.eventKey !== event.tba.key) return;
			matchScouting.add(scouting);
		};
		const remove = (scouting: Scouting.MatchScoutingData) => {
			if (scouting.data.eventKey !== event.tba.key) return;
			matchScouting.remove(scouting);
		};

		const update = () => {
			matchScouting.inform();
		};

		const offNew = Scouting.MatchScouting.on('new', add);
		const offDelete = Scouting.MatchScouting.on('delete', remove);
		const offUpdate = Scouting.MatchScouting.on('update', update);
		const offArchive = Scouting.MatchScouting.on('archive', remove);
		const offRestore = Scouting.MatchScouting.on('restore', add);

		const expires = new SvelteDate();
		expires.setMinutes(expires.getMinutes() + 10);

		event.getMatches(false, expires).then((m) => {
			if (m.isOk()) matches = m.value;
		});

		strategies = Strategy.Strategy.get({ eventKey: event.tba.key }, { type: 'all' });

		return () => {
			offNew();
			offDelete();
			offUpdate();
			offArchive();
			offRestore();
		};
	});

	let selectedMatch: TBAMatch | null = $state(null);
	let shownStrategies = $state(Strategy.Strategy.arr());
	let strategyModal: Modal | undefined = $state(undefined);

	const showStrategies = (strategies: Strategy.StrategyData[], match: TBAMatch) => {
		shownStrategies = Strategy.Strategy.arr(strategies);
		strategyModal?.show();
		selectedMatch = match;
	};
</script>

{#snippet teamLink(teamKey: string, color: 'red' | 'blue', match: TBAMatch)}
	{@const foundTeam = team(teamKey)}
	{@const found = !!findMatch(match, matchScouting.data, foundTeam)}
	<td
		class:table-danger={color === 'red'}
		class:table-primary={color === 'blue'}
		class={inSelected(teamKey, found)}
	>
		<a
			href="/dashboard/event/{data.event.key}/team/{foundTeam}/match/{match.tba.comp_level}/{match
				.tba.match_number}"
			style="text-decoration: none;"
		>
			<span class="badge" class:bg-danger={!found} class:bg-success={found}>
				{foundTeam}
			</span>
		</a>
	</td>
{/snippet}

<div class="container">
	<div class="row mb-3">
		<h1>
			Match Schedule for {event.tba.name}
		</h1>
		<p class="text-muted">
			Matches with team 2122 are outlined in purple.
			<br />
			Click on a team number to view the match scouting page for that team in that match.
			<br />
			Teams in a red bubble have not been scouted yet for that match, while teams in a green bubble have
			been scouted.
			<br />
			Highlight teams in all of their matches from a specific match by selecting the checkbox next to
			it.
			<br />
			You can create strategies for a specific match by clicking the button on the right. Matches with
			existing strategies will have a red badge indicating the number of strategies for that match.
		</p>
	</div>
	<div class="row">
		<div class="table-responsive">
			<table class="table table-striped">
				<tbody>
					{#each matches as match}
						{@const matchStrategies = $strategies.filter(
							(s) =>
								s.data.matchNumber === match.tba.match_number &&
								s.data.compLevel === match.tba.comp_level
						)}
						<tr class:has-2122={has2122(match)}>
							<td>
								<input
									type="checkbox"
									name="match-check-{match.tba.match_number}"
									id="match-check-{match.tba.match_number}"
									onchange={(event) => {
										const checked = event.currentTarget.checked;
										if (checked) {
											selectedMatches = [...selectedMatches, match].filter(
												(m, i, arr) =>
													arr.findIndex(
														(x) =>
															x.tba.match_number === m.tba.match_number &&
															x.tba.comp_level === m.tba.comp_level
													) === i
											);
										} else {
											selectedMatches = selectedMatches.filter(
												(m) =>
													!(
														m.tba.match_number === match.tba.match_number &&
														m.tba.comp_level === match.tba.comp_level
													)
											);
										}
									}}
								/>
							</td>
							<td>
								{match.tba.match_number}
							</td>
							<td>
								{match.tba.comp_level}
							</td>
							<td>
								{dateTime(Number(match.tba.predicted_time) * 1000)}
							</td>
							{@render teamLink(match.tba.alliances.red.team_keys[0], 'red', match)}
							{@render teamLink(match.tba.alliances.red.team_keys[1], 'red', match)}
							{@render teamLink(match.tba.alliances.red.team_keys[2], 'red', match)}
							{@render teamLink(match.tba.alliances.blue.team_keys[0], 'blue', match)}
							{@render teamLink(match.tba.alliances.blue.team_keys[1], 'blue', match)}
							{@render teamLink(match.tba.alliances.blue.team_keys[2], 'blue', match)}
							<td>
								<button
									type="button"
									class="btn btn-sm btm-primary position-relative"
									onclick={() => showStrategies(matchStrategies, match)}
								>
									<i class="material-icons"> analytics </i>
									{#if matchStrategies.length > 0}
										<span
											class="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle"
										>
											<span class="visually-hidden">
												{matchStrategies.length} strategies
											</span>
										</span>
									{/if}
								</button>
								{#if matchStrategies.length}
									({matchStrategies.length})
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<Modal bind:this={strategyModal} title="Match Strategies" size="lg">
	{#snippet body()}
		{#if selectedMatch}
			<h5>{event.tba.name} - {selectedMatch.tba.comp_level}{selectedMatch.tba.match_number}</h5>
		{/if}
		<button
			type="button"
			class="btn btn-primary"
			onclick={async () => {
				if (!selectedMatch) return;
				const name = await prompt('Enter a name for the new strategy:');
				if (!name) return;
				const newStrategy = await Strategy.create({
					match: selectedMatch,
					alliance: selectedMatch.tba.alliances.red.team_keys.includes('frc2122') ? 'red' : 'blue',
					name
				});

				if (newStrategy.isOk()) {
					goto(`/dashboard/event/${event.tba.key}/strategy/${newStrategy.value.data.id}`);
				} else {
					console.error('Failed to create strategy:', newStrategy.error);
					alert('Failed to create strategy. Please try again later.');
				}
			}}
		>
			<i class="material-icons">add</i> Create Strategy
		</button>
		{#key shownStrategies}
			<StrategyGrid strategies={shownStrategies} />
		{/key}
	{/snippet}
</Modal>

<style>
	.highlight {
		background-color: rgba(255, 255, 0, 0.5) !important;
		/* --bs-table-color: rgba(255, 255, 0, 0.5) !important; */
		--bs-table-bg: rgba(0, 0, 0, 0) !important;
		--bs-table-striped-bg: rgba(0, 0, 0, 0) !important;
	}

	.highlight-muted {
		background-color: rgba(0, 255, 0, 0.3) !important;
		/* --bs-table-color: rgba(255, 255, 0, 0.3) !important; */
		--bs-table-bg: rgba(0, 0, 0, 0) !important;
		--bs-table-striped-bg: rgba(0, 0, 0, 0) !important;
	}

	.has-2122 {
		border: 2px solid purple;
	}
</style>
