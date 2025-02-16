<script lang="ts">
	import { Scouting } from '$lib/model/scouting.js';
	import { DataArr } from 'drizzle-struct/front-end';
	import { onMount } from 'svelte';
	import { type TBAMatch } from 'tatorscout/tba';
	import { dateTime } from 'ts-utils/clock';
	import { Navbar } from '$lib/model/navbar.js';

	const { data } = $props();
	const matches = data.matches;
	const event = data.event;

	$effect(() => {
		Navbar.addSection({
			name: `${event.name} Dashboard`,
			priority: 1,
			links: [
				{
					name: `${event.key} Dashboard`,
					href: `/dashboard/event/${event.key}`,
					icon: 'event',
					type: 'material-icons'
				}
			]
		});
	});

	let matchScouting = $state(new DataArr(Scouting.MatchScouting, []));

	onMount(() => {
		matchScouting = Scouting.MatchScouting.fromProperty('eventKey', data.event.key, false);
	});

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
</script>

{#snippet teamLink(teamKey: string, color: 'red' | 'blue', match: TBAMatch)}
	<td class:table-danger={color === 'red'} class:table-primary={color === 'blue'}>
		<a href="/dashboard/event/{data.event.key}/team/{team(teamKey)}" style="text-decoration: none;">
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
