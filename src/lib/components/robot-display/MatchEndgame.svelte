<script lang="ts">
	import { Match2025Schema } from 'tatorscout/tba';
	import { TBAEvent, TBATeam, TBAMatch } from '$lib/utils/tba';
	import z from 'zod';

	interface Props {
		match: TBAMatch;
		team: TBATeam;
		event: TBAEvent;
		classes?: string;
	}

	const { match, team }: Props = $props();

	type MatchSchema = z.infer<typeof Match2025Schema>;

	const tba = match.tba as MatchSchema;

	type EndGameRobotKey = `endGameRobot${1 | 2 | 3}`;

	const getCellClass = (
		teamKey: string,
		allianceTeamKey: string,
		endGameStatus: string
	): string => {
		const highlightClass = allianceTeamKey === teamKey ? 'table-highlight' : '';
		const statusClass =
			endGameStatus === 'DeepCage'
				? 'table-green'
				: endGameStatus === 'ShallowCage'
					? 'table-blue'
					: endGameStatus === 'Parked'
						? 'table-purple'
						: '';
		return `${highlightClass} ${statusClass}`.trim();
	};
</script>

<div>
	<h5 class="text-center">Endgame</h5>
	<table class="table table-bordered">
		<thead>
			<tr>
				<th>Blue Alliance</th>
				<th>Red Alliance</th>
			</tr>
		</thead>
		<tbody>
			{#each [0, 1, 2] as i}
				<tr>
					<td
						class={getCellClass(
							team.tba.key,
							tba.alliances.blue.team_keys[i],
							tba.score_breakdown.blue[`endGameRobot${i + 1}` as EndGameRobotKey]
						)}
					>
						{tba.alliances.blue.team_keys[i].slice(3)}:
						{tba.score_breakdown.blue[`endGameRobot${i + 1}` as EndGameRobotKey] || 'None'}
					</td>
					<td
						class={getCellClass(
							team.tba.key,
							tba.alliances.red.team_keys[i],
							tba.score_breakdown.red[`endGameRobot${i + 1}` as EndGameRobotKey]
						)}
					>
						{tba.alliances.red.team_keys[i].slice(3)}:
						{tba.score_breakdown.red[`endGameRobot${i + 1}` as EndGameRobotKey] || 'None'}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-green {
		color: green;
	}

	.table-blue {
		color: lightblue;
	}

	.table-purple {
		color: rgb(211, 55, 99);
	}

	.table-highlight {
		background-color: darkgray;
	}
</style>
