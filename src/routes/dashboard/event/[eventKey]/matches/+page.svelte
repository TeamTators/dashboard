<script lang="ts">
	import nav from '$lib/imports/robot-display.js';
	import { Scouting } from '$lib/model/scouting.js';
	import { DataArr } from '$lib/services/struct/data-arr';
	import { onMount } from 'svelte';
	import { type TBAMatch } from 'tatorscout/tba';
	import { dateTime } from 'ts-utils/clock';
	import { Navbar } from '$lib/model/navbar.js';

	const { data } = $props();
	const matches = $derived(data.matches);
	const event = $derived(data.event);
	const matchScouting = $derived(new DataArr(Scouting.MatchScouting, data.scouting));

	$effect(() => nav(event));

	const team = (teamKey: string) => {
		return Number(teamKey.substring(3));
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

{#snippet teamLink(teamKey: string, color: 'red' | 'blue', match: TBAMatch)}
	<td class:table-danger={color === 'red'} class:table-primary={color === 'blue'}>
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
	<div class="row">
		<div class="table-responsive">
			<table class="table table-striped">
				<tbody>
					{#each matches as match}
						<tr>
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
