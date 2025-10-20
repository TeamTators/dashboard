import * as TBA from '$lib/server/utils/tba';
import { attemptAsync } from 'ts-utils/check';
import { Scouting } from '../structs/scouting';
import { TraceSchema, type TraceArray } from 'tatorscout/trace';

export const getRankings = async (eventKey: string) => {
	return attemptAsync(async () => {
		const event = await TBA.Event.getEvent(eventKey).unwrap();
		const [teamsRes, matchesRes] = await Promise.all([event.getTeams(), event.getMatches()]);

		const teams = teamsRes.unwrap();
		const matches = matchesRes.unwrap();

		const scouting = await Scouting.MatchScouting.fromProperty('eventKey', eventKey, {
			type: 'all'
		}).unwrap();

		const teamTraces: {
			number: number;
			traces: {
				trace: TraceArray;
				alliance: 'red' | 'blue';
			}[];
		}[] = teams.map((t) => ({
			number: t.tba.team_number,
			traces: scouting
				.filter((s) => s.data.team === t.tba.team_number)
				.map((s) => ({
					trace: TraceSchema.parse(JSON.parse(s.data.trace)) as TraceArray,
					alliance: s.data.alliance === 'red' ? 'red' : 'blue'
				}))
		}));
	});
};
