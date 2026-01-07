<script lang="ts">
	import TeamSelect from '$lib/components/FIRST/TeamSelect.svelte';
	import { Strategy } from '$lib/model/strategy';
	import { alert } from '$lib/utils/prompts.js';
	import type { TBAMatch } from '$lib/utils/tba';
	import { onMount } from 'svelte';
	import { teamsFromMatch } from 'tatorscout/tba';
	import nav from '$lib/imports/robot-display.js';
	import MatchSelect from '$lib/components/FIRST/MatchSelect.svelte';
	import TeamDisplay from '$lib/components/strategy/TeamDisplay.svelte';
	import { listen } from '$lib/utils/struct-listener.js';
	import { Scouting } from '$lib/model/scouting.js';

	const { data } = $props();
	const event = $derived(data.event);
	const matches = $derived(data.matches);
	const teams = $derived(data.teams);
	const strategy = $derived(data.strategy);
	const partners = $derived(data.partners);
	const opponents = $derived(data.opponents);
	const scouting = $derived(data.scouting);
	let scoutingData = $state({
		partner1: new Scouting.MatchScoutingExtendedArr([]),
		partner2: new Scouting.MatchScoutingExtendedArr([]),
		partner3: new Scouting.MatchScoutingExtendedArr([]),
		opponent1: new Scouting.MatchScoutingExtendedArr([]),
		opponent2: new Scouting.MatchScoutingExtendedArr([]),
		opponent3: new Scouting.MatchScoutingExtendedArr([])
	});
	$effect(() => nav(event.tba));

	// const selectTeams = (partners: number[], opponents: number[]) => {
	// 	if (partners.length !== 3) {
	// 		console.log(partners);
	// 		return alert('You must select 3 partners');
	// 	}
	// 	if (opponents.length !== 3) {
	// 		console.log(opponents);
	// 		return alert('You must select 3 opponents');
	// 	}

	// 	if (!partners.includes(2122)) {
	// 		console.log(partners);
	// 		return alert('The Tators must be one of the partners');
	// 	}

	// 	strategy.update((s) => ({
	// 		...s,
	// 		alliance: 'red',
	// 		matchNumber: -1,
	// 		compLevel: 'na',
	// 		type: 'custom',
	// 		partner1: partners[0],
	// 		partner2: partners[1],
	// 		partner3: partners[2],
	// 		opponent1: opponents[0],
	// 		opponent2: opponents[1],
	// 		opponent3: opponents[2]
	// 	}));
	// };

	const selectMatch = (match: TBAMatch) => {
		const teams = teamsFromMatch(match.tba);
		if (!teams.includes(2122)) {
			console.log(teams);
			return alert('You must create a strategy for a team the Tators are in');
		}

		const index = teams.indexOf(2122);
		const allianceColor = index < 3 ? 'red' : 'blue';
		const red = teams.slice(0, 3);
		const blue = teams.slice(3, 6);
		const partners = allianceColor === 'red' ? red : blue;
		const opponents = allianceColor === 'red' ? blue : red;

		strategy.update((s) => ({
			...s,
			alliance: allianceColor,
			matchNumber: match.tba.match_number,
			compLevel: match.tba.comp_level,
			type: 'match',
			partner1: partners[0],
			partner2: partners[1],
			partner3: partners[2],
			opponent1: opponents[0],
			opponent2: opponents[1],
			opponent3: opponents[2]
		}));
	};

	const renderMaxHeight = () => {
		// return;
		// let maxHeight = 0;
		// const cards = document.querySelectorAll('.max-height-item');
		// cards.forEach((card) => {
		// 	card.setAttribute('style', 'height: auto');
		// 	const height = card.clientHeight;
		// 	if (height > maxHeight) {
		// 		maxHeight = height;
		// 	}
		// });
		// cards.forEach((card) => {
		// 	card.setAttribute('style', `height: ${maxHeight}px`);
		// });
	};

	onMount(() => {
		const unsub = strategy.subscribe(() => {
			render++;
		});

		const onresize = () => renderMaxHeight();
		window.addEventListener('resize', onresize);
		setTimeout(renderMaxHeight);

		const p1 = listen(
			scouting.partner1,
			(sc) => sc.data.eventKey === event.tba.key && sc.data.team === strategy.data.partner1
		);
		const p2 = listen(
			scouting.partner2,
			(sc) => sc.data.eventKey === event.tba.key && sc.data.team === strategy.data.partner2
		);
		const p3 = listen(
			scouting.partner3,
			(sc) => sc.data.eventKey === event.tba.key && sc.data.team === strategy.data.partner3
		);
		const o1 = listen(
			scouting.opponent1,
			(sc) => sc.data.eventKey === event.tba.key && sc.data.team === strategy.data.opponent1
		);
		const o2 = listen(
			scouting.opponent2,
			(sc) => sc.data.eventKey === event.tba.key && sc.data.team === strategy.data.opponent2
		);
		const o3 = listen(
			scouting.opponent3,
			(sc) => sc.data.eventKey === event.tba.key && sc.data.team === strategy.data.opponent3
		);

		for (const [key, point] of Object.entries(scouting)) {
			const res = Scouting.MatchScoutingExtendedArr.fromArr(
				point.filter(
					(sc) =>
						sc.data.eventKey === event.tba.key &&
						sc.data.team === strategy.data[key as keyof typeof strategy.data]
				)
			);
			if (res.isOk()) {
				scoutingData[key as keyof typeof scoutingData] = res.value;
			} else {
				console.error('Failed to parse scouting data for', key, ':', res.error);
			}
		}

		return () => {
			window.removeEventListener('resize', onresize);
			unsub();
			p1();
			p2();
			p3();
			o1();
			o2();
			o3();
		};
	});

	type TeamPosition = `${'p' | 'o'}${1 | 2 | 3}`;
	let render = $state(0);
	$effect(() => {
		if (render) renderMaxHeight();
	});

	let staticY: number | undefined = $state(undefined);
</script>

{#snippet startingPos(data: Strategy.PartnerData)}
	<label for="starting-pos-{data.data.id}" class="form-label">Starting Position</label>
	<input
		value={data.data.startingPosition}
		type="text"
		id="starting-pos-{data.data.id}"
		class="form-control"
		onchange={(e) => {
			data.update((d) => ({
				...d,
				startingPosition: e.currentTarget.value
			}));
		}}
		placeholder="Starting Position"
	/>
{/snippet}

{#snippet auto(data: Strategy.PartnerData)}
	<label for="auto-{data.data.id}" class="form-label">Auto</label>
	<input
		value={data.data.auto}
		type="text"
		id="auto-{data.data.id}"
		class="form-control"
		onchange={(e) => {
			data.update((d) => ({
				...d,
				auto: e.currentTarget.value
			}));
		}}
		placeholder="Auto Role"
	/>
{/snippet}

{#snippet postAuto(data: Strategy.PartnerData | Strategy.OpponentData)}
	<label for="post-auto-{data.data.id}" class="form-label">Post Auto</label>
	<textarea
		id="post-auto-{data.data.id}"
		class="form-control"
		onchange={(e) => {
			data.update((d) => ({
				...d,
				postAuto: e.currentTarget.value
			}));
		}}
		placeholder="Immediately after Auto...">{data.data.postAuto}</textarea
	>
{/snippet}

{#snippet role(data: Strategy.PartnerData | Strategy.OpponentData)}
	<label for="role-{data.data.id}" class="form-label">Role</label>
	<textarea
		id="role-{data.data.id}"
		class="form-control"
		onchange={(e) => {
			data.update((d) => ({
				...d,
				role: e.currentTarget.value
			}));
		}}
		placeholder="General Role">{data.data.role}</textarea
	>
{/snippet}

{#snippet endgame(data: Strategy.PartnerData)}
	<label for="endgame-{data.data.id}" class="form-label">Endgame</label>
	<input
		value={data.data.endgame}
		type="text"
		id="endgame-{data.data.id}"
		class="form-control"
		onchange={(e) => {
			data.update((d) => ({
				...d,
				endgame: e.currentTarget.value
			}));
		}}
		placeholder="Endgame Task..."
	/>
{/snippet}

{#snippet notes(data: Strategy.PartnerData | Strategy.OpponentData)}
	<label for="notes-{data.data.id}" class="form-label">Notes</label>
	<textarea
		id="notes-{data.data.id}"
		class="form-control"
		onchange={(e) => {
			data.update((d) => ({
				...d,
				notes: e.currentTarget.value
			}));
		}}
		placeholder="Any additional comments...">{data.data.notes}</textarea
	>
{/snippet}

{#snippet teamSelect(team: number, position: TeamPosition)}
	<div class="d-flex justify-content-between">
		<TeamSelect
			{teams}
			selected={teams.find((t) => t.tba.team_number === team)}
			onSelect={async (selectedTeam) => {
				if (selectedTeam.tba.team_number === team) return;
				const { partner1, partner2, partner3 /*opponent1, opponent2, opponent3*/ } = $strategy;
				const tators = [partner1, partner2, partner3].filter((t) => t === 2122).length;

				const partner = async () => {
					if (team === 2122 && tators < 1) {
						await alert('The Tators must be one of the partners');
						render++;
						return false;
					}
					return true;
				};

				switch (position) {
					case 'p1':
						if (await partner()) {
							strategy.update((s) => ({
								...s,
								partner1: selectedTeam.tba.team_number
							}));
						}
						break;
					case 'p2':
						if (await partner()) {
							strategy.update((s) => ({
								...s,
								partner2: selectedTeam.tba.team_number
							}));
						}
						break;
					case 'p3':
						if (await partner()) {
							strategy.update((s) => ({
								...s,
								partner3: selectedTeam.tba.team_number
							}));
						}
						break;
					case 'o1':
						strategy.update((s) => ({
							...s,
							opponent1: selectedTeam.tba.team_number
						}));
						break;
					case 'o2':
						strategy.update((s) => ({
							...s,
							opponent2: selectedTeam.tba.team_number
						}));
						break;
					case 'o3':
						strategy.update((s) => ({
							...s,
							opponent3: selectedTeam.tba.team_number
						}));
						break;
					default:
						throw new Error(`Invalid position: ${position}`);
				}
			}}
		/>
		<a href="/dashboard/event/{event.tba.key}/team/{team}" class="btn">
			<i class="material-icons"> visibility </i>
		</a>
	</div>
{/snippet}

{#snippet partner(
	team: number,
	data: Strategy.PartnerData,
	position: TeamPosition,
	scouting: Scouting.MatchScoutingExtendedArr
)}
	<div class="card layer-1 mb-3 grid-item max-height-item">
		<div class="card-body">
			<div class="container-fluid">
				<div class="row mb-3">
					{@render teamSelect(team, position)}
				</div>
				<hr />
				<div class="row mb-3">
					<h5>Auto</h5>
				</div>
				<div class="row mb-3">
					<div class="col-md-6">
						{@render startingPos(data)}
					</div>
					<div class="col-md-6">
						{@render auto(data)}
					</div>
				</div>
				<hr />
				<div class="row mb-3">
					<h5>Teleop</h5>
				</div>
				<div class="row mb-3">
					<div class="col-md-4">
						{@render postAuto(data)}
					</div>
					<div class="col-md-4">
						{@render role(data)}
					</div>
					<div class="col-md-4">
						{@render endgame(data)}
					</div>
				</div>
				<hr />
				<div class="row mb-3">
					<div class="col-md-12">
						{@render notes(data)}
					</div>
				</div>
				<div class="row mb-3">
					<div class="card layer-2">
						<div class="card-body">
							<TeamDisplay
								teamNumber={team}
								{teams}
								matches={matches.filter((match) => teamsFromMatch(match.tba).includes(team))}
								{event}
								{scouting}
								bind:staticY
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/snippet}

{#snippet opponent(
	team: number,
	data: Strategy.OpponentData,
	position: TeamPosition,
	scouting: Scouting.MatchScoutingExtendedArr
)}
	<div class="card layer-1 mb-3 grid-item max-height-item">
		<div class="card-body">
			<div class="container-fluid">
				<div class="row mb-3">
					{@render teamSelect(team, position)}
				</div>
				<hr />
				<div class="row mb-3">
					<h5>Teleop</h5>
				</div>
				<div class="row mb-3">
					<div class="col-md-6">
						{@render postAuto(data)}
					</div>
					<div class="col-md-6">
						{@render role(data)}
					</div>
				</div>
				<hr />
				<div class="row mb-3">
					<div class="col-md-12">
						{@render notes(data)}
					</div>
				</div>
				<div class="row mb-3">
					<div class="card layer-2">
						<div class="card-body">
							<TeamDisplay
								teamNumber={team}
								{teams}
								matches={matches.filter((match) => teamsFromMatch(match.tba).includes(team))}
								{event}
								{scouting}
								bind:staticY
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/snippet}

{#key render}
	<div class="container-fluid">
		<div class="row mb-3">
			<div class="col-12">
				<h1>Strategy</h1>
				<p class="small text-muted mb-2">*No field is required</p>
			</div>
		</div>
		<div class="row mb-3">
			<div class="col-md-6">
				<label for="strategy-name" class="form-label">Strategy Name</label>
				<input
					type="text"
					id="strategy-name"
					class="form-control"
					value={$strategy.name}
					oninput={(e) => {
						strategy.update((s) => ({
							...s,
							name: e.currentTarget.value
						}));
					}}
					placeholder="Strategy Name"
				/>
			</div>
			<div class="col-md-6">
				<label for="strategy-match-select" class="form-label">Match Select</label>
				<MatchSelect
					matches={matches.filter((match) => teamsFromMatch(match.tba).includes(2122))}
					selected={matches.find(
						(m) =>
							m.tba.match_number === $strategy.matchNumber &&
							m.tba.comp_level === $strategy.compLevel
					)}
					onSelect={async (selectedMatch) => {
						if (
							selectedMatch.tba.match_number === $strategy.matchNumber &&
							selectedMatch.tba.comp_level === $strategy.compLevel
						)
							return;
						selectMatch(selectedMatch);
					}}
					message="Select teams from a match"
				/>
			</div>
		</div>
		<div class="row mb-3">
			<!-- <div class="grid"> -->
			<div class="col-md-6">
				<h2 class="mb-3">Partners</h2>
				{@render partner(Number($strategy.partner1), partners[0], 'p1', scoutingData.partner1)}
				{@render partner(Number($strategy.partner2), partners[1], 'p2', scoutingData.partner2)}
				{@render partner(Number($strategy.partner3), partners[2], 'p3', scoutingData.partner3)}
			</div>
			<div class="col-md-6">
				<h2 class="mb-3">Opponents</h2>
				{@render opponent(Number($strategy.opponent1), opponents[0], 'o1', scoutingData.opponent1)}
				{@render opponent(Number($strategy.opponent2), opponents[1], 'o2', scoutingData.opponent2)}
				{@render opponent(Number($strategy.opponent3), opponents[2], 'o3', scoutingData.opponent3)}
			</div>

			<!-- </div> -->
		</div>
	</div>
{/key}

<!-- <style>
    .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .grid-item {
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.1);
    }
</style> -->
