// take in an array of actions
// return a table showing the totals of all actions summed
// columns are the matches
// rows are the teams
// each cell is filled with the amount of all actions summed

import {
	Trace,
	TraceSchema,
	type TraceArray,
	type Action2025,
	type Action
} from 'tatorscout/trace';
import { Event, Team, Match } from './tba';
import { Scouting } from '../structs/scouting';
import { teamsFromMatch } from 'tatorscout/tba';
import { attemptAsync } from 'ts-utils/check';
import { Table } from './google-summary';

export const actionSummary = (eventKey: string, actions: Action[]) => {
	return attemptAsync(async () => {
		const cache = new Map<number, { trace: TraceArray; match: Scouting.MatchScoutingData }[]>();

		const getAllTraces = async (team: Team) => {
			const cached = cache.get(team.tba.team_number);
			if (cached) return cached;
			const matchScouting = (
				await Scouting.getTeamScouting(team.tba.team_number, event.tba.key)
			).unwrap();
			const data = matchScouting.map((s) => ({
				trace: TraceSchema.parse(JSON.parse(s.data.trace)) as TraceArray,
				match: s
			}));
			cache.set(team.tba.team_number, data);
			return data;
		};
		const event = (await Event.getEvent(eventKey)).unwrap();
		const matches = (await event.getMatches())
			.unwrap()
			.filter((m) => ['red', 'blue', 'tie'].includes(String(m.tba.winning_alliance)));
		const teams = (await event.getTeams()).unwrap();
		const teamTraces = await Promise.all(
			teams.map(async (t) => {
				return {
					team: t,
					traces: await getAllTraces(t)
				};
			})
		);

		const getActionCount = async (team: Team, match: Match) => {
			const traces = teamTraces.find(
				(t) => t.team.tba.team_number === team.tba.team_number
			)?.traces;
			if (!traces) throw new Error('No traces found');
			const matchTrace = traces.find((trace) => {
				return (
					trace.match.data.matchNumber === match.tba.match_number &&
					trace.match.data.compLevel === match.tba.comp_level &&
					trace.match.data.team === team.tba.team_number
				);
			});
			if (!matchTrace) return;
			return matchTrace.trace.reduce((acc, point) => {
				const [, , , action] = point;
				if (!action) return acc;


				if ((['teleop', 'endgame'].includes(Trace.getSection(point))) && actions.includes(action)) {
					// console.log('Action found:', action, acc);
					return acc + 1;
				}
				return acc;
			}, 0);
		};

		const t = new Table(eventKey);

		t.column('Team Number', (t) => t.tba.team_number);
		t.column('Team Name', (t) => t.tba.nickname || 'Unknown');
		for (const match of matches) {
			t.column(match.tba.comp_level + match.tba.match_number, (t) => {
				return getActionCount(t, match);
			});
		}

		// teams.forEach((team) => {
		// 	t.column('Team Number', (t) => t.tba.team_number);
		// 	matches.forEach((match) => {
		// 		const allianceTeams = [
		// 			...match.tba.alliances.red.team_keys,
		// 			...match.tba.alliances.blue.team_keys
		// 		];

		// 		if (allianceTeams.includes(`frc${team.tba.team_number}`)) {
		// 			t.column(match.tba.match_number.toString(), async (t) => {
		// 				return await getActionCount(t, match, action);
		// 			});
		// 		} else {
		// 			t.column(match.tba.match_number.toString(), async () => {
		// 				return '';
		// 			});
		// 		}
		// 	});
		// });

		return t;
	});
};
