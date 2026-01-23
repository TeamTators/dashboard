<script lang="ts">
	import { dateTime } from 'ts-utils/clock';
	import { Scouting } from '$lib/model/scouting';
	import { onMount } from 'svelte';
	import { TBATeam, TBAMatch, TBAEvent } from '$lib/utils/tba';

	interface Props {
		event: TBAEvent;
		team: TBATeam;
		scouting: Scouting.MatchScoutingExtendedArr;
	}

	const { team, event, scouting }: Props = $props();

	let matches: TBAMatch[] = $state([]);

	const generateMatchStr = (match: TBAMatch) => {
		return `${match.tba.comp_level} ${match.tba.match_number}`;
	};

	const generateTime = (match: TBAMatch) => {
		if (match.tba.actual_time) {
			return dateTime(match.tba.actual_time * 1000);
		} else {
			return dateTime(Number(match.tba.predicted_time) * 1000);
		}
	};

	const generateFlagColor = (match?: Scouting.MatchScoutingExtended) => {
		if (!match) return 'danger';
		// TODO: Implement flag color
		return 'success';
	};

	const generateFlagTitle = (match?: Scouting.MatchScoutingExtended) => {
		if (!match) return 'No Scouting data';
		// TODO: Parse checks
		return 'Scouting data available';
	};

	const generateStatus = (match: TBAMatch) => {
		if (!match.tba.score_breakdown) {
			return 'Not Played';
		} else {
			return 'Played';
		}
	};

	onMount(() => {
		const d = new Date();
		d.setMinutes(d.getMinutes() + 10);
		team.getMatches(true, d).then((m) => {
			if (m.isOk()) {
				matches = m.value;
			}
		});
	});

	let table: HTMLTableElement;

	const findMatch = (scouting: Scouting.MatchScoutingExtended[], match: TBAMatch) => {
		return scouting.find((m) => {
			return m.compLevel === match.tba.comp_level && m.matchNumber === match.tba.match_number;
		});
	};
</script>

<div class="scroll-y" style="overflow-y: hidden; max-height: 100%;">
	<div class="table-responsive">
		<a
			href="/dashboard/event/{event.tba.key}/team/{team.tba.team_number}/traces"
			class="btn btn-primary"
		>
			View all Traces
		</a>
		<table class="table table-striped table-hover" bind:this={table}>
			<thead>
				<tr>
					<th>Match</th>
					<th>Time</th>
					<th>Flag</th>
					<th>Status</th>
					<th>View</th>
				</tr>
			</thead>
			<tbody>
				{#each matches as match}
					<tr>
						<td>{generateMatchStr(match)}</td>
						<td>{generateTime(match)}</td>
						<td>
							<i
								class="material-icons text-{generateFlagColor(findMatch($scouting, match))}"
								style="color: "
								title={generateFlagTitle(findMatch($scouting, match))}
							>
								flag
							</i>
						</td>
						<td>{generateStatus(match)}</td>
						<td>
							<a
								href="/dashboard/event/{event.tba.key}/team/{team.tba.team_number}/match/{match.tba
									.comp_level}/{match.tba.match_number}"
								class="btn btn-primary"
							>
								<i class="material-icons">visibility</i></a
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
