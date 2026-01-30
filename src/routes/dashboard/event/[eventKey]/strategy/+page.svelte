<script lang="ts">
	import MatchSelect from '$lib/components/FIRST/MatchSelect.svelte';
	import TeamSelect from '$lib/components/FIRST/TeamSelect.svelte';
	import { alert, prompt, select } from '$lib/utils/prompts.js';
	import { listen } from '$lib/utils/struct-listener.js';
	import type { TBAMatch, TBATeam } from '$lib/utils/tba.js';
	import { onMount } from 'svelte';
	import { teamsFromMatch } from 'tatorscout/tba';
	import { capitalize } from 'ts-utils/text';
	import { Strategy } from '$lib/model/strategy.js';
	import { goto } from '$app/navigation';
	import { Account } from '$lib/model/account.js';
	import nav from '$lib/imports/robot-display.js';
	import { SvelteDate } from 'svelte/reactivity';

	const { data } = $props();

	const event = $derived(data.event);
	const matches = $derived(data.matches);
	const teams = $derived(data.teams);
	const strategies = $derived(data.strategies);
	const self = Account.getSelf();

	$effect(() => nav(event.tba));

	let name = $state('');
	let partner1: TBATeam | undefined = $state(undefined);
	let partner2: TBATeam | undefined = $state(undefined);
	let partner3: TBATeam | undefined = $state(undefined);

	let opponent1: TBATeam | undefined = $state(undefined);
	let opponent2: TBATeam | undefined = $state(undefined);
	let opponent3: TBATeam | undefined = $state(undefined);

	let match: TBAMatch | undefined = $state(undefined);
	let alliance: 'red' | 'blue' | 'unknown' = $state('unknown');

	const selectFromMatch = async (match: TBAMatch) => {
		const date = new SvelteDate();
		date.setMinutes(date.getMinutes() + 10);
		const teams = await match.getTeams(false, date);
		if (teams.isErr()) return console.error(teams.error);
		const teamNumbers = teamsFromMatch(match.tba);
		// const teamNumbers = teams.value.map((team) => team.tba.team_number);
		if (!teamNumbers.includes(2122)) {
			return alert('You must select a match that your team is in.');
		}
		const teamList = teams.value;
		const red = teamList.slice(0, 3);
		const blue = teamList.slice(3, 6);
		alliance = teamNumbers.indexOf(2122) < 3 ? 'red' : 'blue';
		const partners = alliance === 'red' ? red : blue;
		const opponents = alliance === 'red' ? blue : red;

		partner1 = partners[0];
		partner2 = partners[1];
		partner3 = partners[2];
		opponent1 = opponents[0];
		opponent2 = opponents[1];
		opponent3 = opponents[2];
	};

	const selectFromTeams = () => {
		match = undefined;
		alliance = 'unknown';
	};

	const create = async () => {
		if (
			[partner1, partner2, partner3, opponent1, opponent2, opponent3].filter(Boolean).length < 6
		) {
			return alert('All team positions must be filled. This can change later');
		}

		if (!name) {
			const n = await prompt('Strategy Name');
			if (!n) return;
			name = n;
		}

		Strategy.Strategy.on('new', (s) => {
			if (s.data.name === name) {
				gotoStrategy(s);
			}
		});

		Strategy.Strategy.new({
			name,
			eventKey: event.tba.key,
			matchNumber: match?.tba.match_number || -1,
			compLevel: match?.tba.comp_level || 'na',
			type: match ? 'match' : 'custom',
			partner1: partner1?.tba.team_number || 0,
			partner2: partner2?.tba.team_number || 0,
			partner3: partner3?.tba.team_number || 0,
			opponent1: opponent1?.tba.team_number || 0,
			opponent2: opponent2?.tba.team_number || 0,
			opponent3: opponent3?.tba.team_number || 0,
			alliance,
			createdBy: $self.data.id || 'unknown'
		});
	};

	const gotoStrategy = async (s: Strategy.StrategyData) => {
		goto(`/dashboard/event/${event.tba.key}/strategy/${s.data.id}`);
	};

	const selectStrategy = async () => {
		const strategy = await select('Select a strategy', $strategies, {
			render: (s) => String(s.data.name)
		});
		if (!strategy) return;

		gotoStrategy(strategy);
	};

	onMount(() => {
		const unsub = listen(strategies, (d) => d.data.eventKey === event.tba.key);
		return () => {
			unsub();
		};
	});
</script>

<div class="container">
	<div class="row mb-3">
		<div class="col-12">
			<div class="d-flex justify-content-between align-items-center">
				<h1>Create a Strategy</h1>
				<button type="button" class="btn" onclick={selectStrategy}>
					<i class="material-icons"> open_in_new </i>
					Open Existing ({$strategies.length})
				</button>
			</div>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-12">
			<label for="strategy-name" class="form-label">Strategy Name</label>
			<input type="text" class="form-control" bind:value={name} placeholder="Strategy Name" />
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-md-6">
			<label for="strategy-match" class="form-label">Match</label>
			<MatchSelect
				matches={matches.filter((m) => teamsFromMatch(m.tba).includes(2122))}
				onSelect={selectFromMatch}
				message="Select teams from a match"
			/>
		</div>
		<div class="col-md-6 d-flex align-items-end">
			<h4>
				Alliance: <span
					class:text-danger={alliance === 'red'}
					class:text-primary={alliance === 'blue'}
					class:text-secondary={alliance === 'unknown'}>{capitalize(alliance)}</span
				>
			</h4>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-md-6">
			<label for="partners" class="mb-2"> Partners </label>
			<div class="d-flex">
				<TeamSelect
					{teams}
					bind:selected={partner1}
					message="Select a partner"
					onSelect={selectFromTeams}
				/>
				<TeamSelect
					{teams}
					bind:selected={partner2}
					message="Select a partner"
					onSelect={selectFromTeams}
				/>
				<TeamSelect
					{teams}
					bind:selected={partner3}
					message="Select a partner"
					onSelect={selectFromTeams}
				/>
			</div>
		</div>
		<div class="col-md-6">
			<label for="opponents" class="mb-2"> Opponents </label>
			<div class="d-flex">
				<TeamSelect
					{teams}
					bind:selected={opponent1}
					message="Select an opponent"
					onSelect={selectFromTeams}
				/>
				<TeamSelect
					{teams}
					bind:selected={opponent2}
					message="Select an opponent"
					onSelect={selectFromTeams}
				/>
				<TeamSelect
					{teams}
					bind:selected={opponent3}
					message="Select an opponent"
					onSelect={selectFromTeams}
				/>
			</div>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col-12">
			<button type="button" class="btn btn-success w-100" onclick={create}>
				<i class="material-icons">add</i>
				Create new strategy
			</button>
		</div>
	</div>
</div>
