<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import { Scouting } from '$lib/model/scouting.js';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import { type TBAMatch } from 'tatorscout/tba';
	import { dateTime } from 'ts-utils/clock';

	const { data } = $props();
	const matches = $derived(data.matches);
	const event = $derived(data.event);
	const matchScouting = $derived(new DataArr(Scouting.MatchScouting, data.scouting));

	let selectedMatches: TBAMatch[] = $state([]);

	$effect(() => nav(event));

	const team = (teamKey: string) => {
		return Number(teamKey.substring(3));
	};

	const inSelected = (
		teamKey: string,
	) => {
		for (const match of selectedMatches) {
			if (
				match.alliances.red.team_keys.includes(teamKey) ||
				match.alliances.blue.team_keys.includes(teamKey)
			) {
				return true;
			}
		}
		return false;
	};

	const findMatch = (
		match: TBAMatch,
		matchScouting: Scouting.MatchScoutingData[],
		team: number
	) => {
		return matchScouting.find(
			(m) =>
				m.data.matchNumber === match.match_number &&
				m.data.compLevel === match.comp_level &&
				m.data.team === team
		);
	};

	const has2122 = (match: TBAMatch) => {
		return match.alliances.red.team_keys.includes('frc2122') || match.alliances.blue.team_keys.includes('frc2122');
	}

	onMount(() => {
		const add = (scouting: Scouting.MatchScoutingData) => {
			if (scouting.data.eventKey !== event.key) return;
			matchScouting.add(scouting);
		};
		const remove = (scouting: Scouting.MatchScoutingData) => {
			if (scouting.data.eventKey !== event.key) return;
			matchScouting.remove(scouting);
		};

		const update = () => {
			matchScouting.inform();
		};

		Scouting.MatchScouting.on('new', add);
		Scouting.MatchScouting.on('delete', remove);
		Scouting.MatchScouting.on('update', update);
		Scouting.MatchScouting.on('archive', remove);
		Scouting.MatchScouting.on('restore', add);
	});
</script>

<style>
	.highlight {
		background-color: rgba(255, 255, 0, 0.5) !important;
	}

	.has-2122 {
		border: 2px solid purple;
	}
</style>

{#snippet teamLink(teamKey: string, color: 'red' | 'blue', match: TBAMatch)}
	<td 
		class:table-danger={color === 'red'} 
		class:table-primary={color === 'blue'}
		class:highlight={inSelected(teamKey)}
	>
		<a
			href="/dashboard/event/{data.event.key}/team/{team(
				teamKey
			)}/match/{match.comp_level}/{match.match_number}"
			style="text-decoration: none;"
		>
			<span
				class="badge"
				class:bg-danger={!findMatch(match, matchScouting.data, team(teamKey))}
				class:bg-success={!!findMatch(match, matchScouting.data, team(teamKey))}
			>
				{team(teamKey)}
			</span>
		</a>
	</td>
{/snippet}

<div class="container">
	<div class="row mb-3">
		<h1>
			Match Schedule for {event.name}
		</h1>
		<p class="text-muted">
			Highlight teams from a match by selecting the checkbox next to it.
			<br>
			Click on a team number to view the match scouting page for that team in that match.
			<br>
			Matches with team 2122 are outlined in purple.
		</p>
	</div>
	<div class="row">
		<div class="table-responsive">
			<table class="table table-striped">
				<tbody>
					{#each matches as match}
						<tr
							class:has-2122={has2122(match)}
						>
							<td>
								<input type="checkbox" name="" id="match-check-{match.match_number}" onchange={(event) => {
									const checked = event.currentTarget.checked;
									if (checked) {
										selectedMatches = Array.from(new Set([...selectedMatches, match]));
									} else {
										selectedMatches = selectedMatches.filter(m => !(
											m.match_number === match.match_number &&
											m.comp_level === match.comp_level
										));
									}
								}}>
							</td>
							<td>
								{match.match_number}
							</td>
							<td>
								{match.comp_level}
							</td>
							<td>
								{dateTime(Number(match.predicted_time) * 1000)}
							</td>
							{@render teamLink(match.alliances.red.team_keys[0], 'red', match)}
							{@render teamLink(match.alliances.red.team_keys[1], 'red', match)}
							{@render teamLink(match.alliances.red.team_keys[2], 'red', match)}
							{@render teamLink(match.alliances.blue.team_keys[0], 'blue', match)}
							{@render teamLink(match.alliances.blue.team_keys[1], 'blue', match)}
							{@render teamLink(match.alliances.blue.team_keys[2], 'blue', match)}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
