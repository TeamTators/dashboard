<script lang="ts">
	import { dateTime } from 'ts-utils/clock';
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import { TBATeam, TBAMatch, TBAEvent } from '$lib/utils/tba';
	import { DataArr } from 'drizzle-struct/front-end';

	interface Props {
		event: TBAEvent;
		team: TBATeam;
	}

	const { team, event }: Props = $props();

	let matches: TBAMatch[] = $state([]);

	let matchScouting = $state(new DataArr(Scouting.MatchScouting, []));

	const generateMatchStr = (match: TBAMatch) => {
		if (match.tba.comp_level === 'sf') {
			return `sf ${match.tba.set_number}`;
		} else {
			return `${match.tba.comp_level} ${match.tba.match_number}`;
		}
	};

	const generateTime = (match: TBAMatch) => {
		if (match.tba.actual_time) {
			return dateTime(match.tba.actual_time * 1000);
		} else {
			return dateTime(Number(match.tba.predicted_time) * 1000);
		}
	};

	const generateFlagColor = (match?: Scouting.MatchScoutingData) => {
		if (!match) return 'white';
		// TODO: Implement flag color
	};

	const generateFlagTitle = (match?: Scouting.MatchScoutingData) => {
		if (!match) return 'No Scouting data';
		// TODO: Parse checks
	};

	const generateStatus = (match: TBAMatch) => {
		if (!match.tba.score_breakdown) {
			return 'Not Played';
		} else {
			return 'Played';
			// const winning = match.winning_alliance;
			// const alliance = match.alliances.red.team_keys.includes('frc' + team.data.number)
			//     ? 'red'
			//     : 'blue';
			// return winning === alliance ? 'Win' : 'Loss';
		}
	};

	onMount(() => {
		team.getMatches().then((m) => {
			if (m.isOk()) {
				matches = m.value;
			}
		});

		matchScouting = Scouting.getMatchScouting({
			eventKey: event.tba.key,
			team: team.tba.team_number
		});

		import('bootstrap').then((bs) => {
			table.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
				new bs.Tooltip(el);
			});
		});

		return () => {
			import('bootstrap').then((bs) => {
				table.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
					const tooltip = bs.Tooltip.getInstance(el);
					if (tooltip) tooltip.dispose();
				});
			});
		};
	});

	let table: HTMLTableElement;

	const findMatch = (match: TBAMatch) => {
		return matchScouting.data.find((m) => {
			if (match.tba.comp_level === 'sf') {
				return m.data.compLevel === 'sf' && m.data.matchNumber === match.tba.set_number;
			} else {
				return (
					m.data.compLevel === match.tba.comp_level && m.data.matchNumber === match.tba.match_number
				);
			}
		});
	};
</script>

<div class="scroll-y" style="overflow-y: hidden; max-height: 100%;">
	<div class="table-responsive">
		<table class="table table-striped table-hover" bind:this={table}>
			<thead>
				<tr>
					<th>Match</th>
					<th>Time</th>
					<th>Flag</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#each matches as match}
					<tr>
						<td>{generateMatchStr(match)}</td>
						<td>{generateTime(match)}</td>
						<td>
							<i
								class="material-icons"
								style="color: {generateFlagColor(findMatch(match))}"
								data-bs-toggle="tooltip"
								data-bs-placement="top"
								title={generateFlagTitle(findMatch(match))}
							>
								flag
							</i>
						</td>
						<td>{generateStatus(match)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
