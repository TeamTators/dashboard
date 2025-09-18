import { attemptAsync } from 'ts-utils/check';
import { Event, Team } from './tba';
import { z } from 'zod';
import { Scouting } from '../structs/scouting';
import { Trace, TraceSchema, type TraceArray } from 'tatorscout/trace';
import terminal from './terminal';
import { DB } from '../db';
import { and, eq } from 'drizzle-orm';
import { type RequestEvent } from '@sveltejs/kit';
import { teamsFromMatch } from 'tatorscout/tba';

/**
 * Memoization utility for caching expensive function results
 * 
 * This utility enables significant performance optimizations by:
 * - Caching database query results (pit scouting, team scouting)
 * - Caching complex score calculations that are reused across multiple columns
 * - Caching trace processing and analysis results
 * - Reducing redundant API calls (team status, rankings)
 * 
 * The cache is maintained per function call with intelligent key generation
 * to ensure correct cache hits while avoiding memory leaks.
 */
function memoize<TArgs extends unknown[], TReturn>(
	fn: (...args: TArgs) => TReturn,
	keyGenerator?: (...args: TArgs) => string
): (...args: TArgs) => TReturn {
	const cache = new Map<string, TReturn>();
	
	return (...args: TArgs): TReturn => {
		const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
		
		if (cache.has(key)) {
			return cache.get(key)!;
		}
		
		const result = fn(...args);
		cache.set(key, result);
		return result;
	};
}

export const auth = (event: RequestEvent) => {
	// const key = event.request.headers.get('X-Auth-Key');
	// if (key !== process.env.WEBHOOK_AUTH_KEY) {
	// 	console.error('Unauthorized webhook ping event', key, process.env.WEBHOOK_AUTH_KEY);
	// 	throw fail(ServerCode.unauthorized, {
	// 		message: 'Unauthorized'
	// 	});
	// }
};

type ColType = number | string | undefined | void;
export const summarize = async (eventKey: string) => {
	return attemptAsync(async () => {
		const event = (await Event.getEvent(eventKey)).unwrap();
		const matches = (await event.getMatches()).unwrap();

		if (event.tba.year !== 2025) throw new Error('Only 2025 events are currently supported');

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

		// Memoized version of getScores to cache results per team
		const getScores = memoize(async (team: Team) => {
			try {
				const traces = await getAllTraces(team);
				if (!traces) throw new Error('No traces found');
				const teamMatches = matches.filter((m) =>
					teamsFromMatch(m.tba).includes(team.tba.team_number)
				);
				if (teamMatches.length === 0) throw new Error('No matches found');

				// TODO: include tba climb and mobility score here
				// Return a new object with { traceScore: (current score), endgame: number, mobility: number }
				// For each of the listeners below, you'll need to do `scores.map(s => s.traceScore.something)` instead of `scores.map(s => s.something)`
				// Then, fill out the blank columns below with the appropriate values

				const traceScore = traces.map((t) =>
					Trace.score.parse2025(t.trace, (t.match.data.alliance || 'red') as 'red' | 'blue')
				);

				const endgame: { dpc: number; shc: number; park: number }[] = [];
				const mobility: number[] = [];
				type EndGameRobotKey = `endGameRobot${1 | 2 | 3}`;
				type AutoLineKey = `autoLineRobot${1 | 2 | 3}`;

				for (const match of teamMatches) {
					const scoreBreakdown = match.tba.score_breakdown;
					if (!scoreBreakdown) continue;

					const alliance = match.tba.alliances.red.team_keys.includes(team.tba.key)
						? 'red'
						: 'blue';

					const teamIndex = match.tba.alliances[alliance].team_keys.indexOf(team.tba.key);
					const status = (
						scoreBreakdown?.[alliance] as Record<EndGameRobotKey, string | undefined>
					)?.[`endGameRobot${teamIndex + 1}` as EndGameRobotKey];

					endgame.push({
						dpc: status === 'DeepCage' ? 12 : 0,
						shc: status === 'ShallowCage' ? 6 : 0,
						park: status === 'Parked' ? 2 : 0
					});

					mobility.push(
						(
							(scoreBreakdown?.[alliance] as Record<AutoLineKey, string | undefined>)?.[
								`autoLineRobot${teamIndex + 1}` as AutoLineKey
							] ?? ''
						).length > 0
							? 2
							: 0
					);
				}

				return { traceScore, endgame, mobility };
			} catch (error) {
				terminal.error(`Error pulling scores for team ${team.tba.team_number}`, error);
				throw error;
			}
		}, (team: Team) => `getScores_${team.tba.team_number}`);

		// Memoized version of getScoresWithoutDefense to cache results per team
		const getScoresWithoutDefense = memoize(async (team: Team) => {
			try {
				const traces = await getAllTraces(team);
				if (!traces) throw new Error('No traces found');
				const teamMatches = matches.filter((m) =>
					teamsFromMatch(m.tba).includes(team.tba.team_number)
				);
				if (teamMatches.length === 0) throw new Error('No matches found');

				const traceScore = traces
					.map((t) => {
						if (!t.match.data.checks.includes('defense')) {
							return Trace.score.parse2025(
								t.trace,
								(t.match.data.alliance || 'red') as 'red' | 'blue'
							);
						}
					})
					.filter((score) => score !== undefined); // Remove undefined values

				return { traceScore };
			} catch (error) {
				terminal.error(`Error pulling scores for team ${team.tba.team_number}`, error);
				throw error;
			}
		}, (team: Team) => `getScoresWithoutDefense_${team.tba.team_number}`);

		// Memoized version of getPitScouting to cache results per team and question
		const getPitScouting = memoize(async (requestedQuestion: string, team: Team) => {
			try {
				const res = await DB.select()
					.from(Scouting.PIT.Answers.table)
					.innerJoin(
						Scouting.PIT.Questions.table,
						eq(Scouting.PIT.Answers.table.questionId, Scouting.PIT.Questions.table.id)
					)
					.innerJoin(
						Scouting.PIT.Groups.table,
						eq(Scouting.PIT.Questions.table.groupId, Scouting.PIT.Groups.table.id)
					)
					.innerJoin(
						Scouting.PIT.Sections.table,
						eq(Scouting.PIT.Groups.table.sectionId, Scouting.PIT.Sections.table.id)
					)
					.where(
						and(
							eq(Scouting.PIT.Answers.table.team, team.tba.team_number),
							eq(Scouting.PIT.Questions.table.key, requestedQuestion),
							eq(Scouting.PIT.Sections.table.eventKey, event.tba.key)
						)
					);

				if (res.length === 0) {
					return 'unknown';
				}
				return z.array(z.string()).parse(JSON.parse(res[0].pit_answers.answer))[0];
			} catch (error) {
				terminal.error(`Error pulling pitscouting for team: ${team}`, error);
				throw error;
			}
		}, (requestedQuestion: string, team: Team) => `getPitScouting_${requestedQuestion}_${team.tba.team_number}`);



		// Memoize expensive velocity and scouting calculations
		const getTeamScouting = memoize(async (teamNumber: number, eventKey: string) => {
			return (await Scouting.getTeamScouting(teamNumber, eventKey)).unwrap();
		}, (teamNumber: number, eventKey: string) => `teamScouting_${teamNumber}_${eventKey}`);

		const getAverageVelocity = memoize(async (team: Team) => {
			const matchScouting = await getTeamScouting(team.tba.team_number, eventKey);
			return average(
				matchScouting.map((s) =>
					Trace.velocity.average(TraceSchema.parse(JSON.parse(s.data.trace)) as TraceArray)
				)
			);
		}, (team: Team) => `averageVelocity_${team.tba.team_number}`);

		const getChecks = memoize(async (team: Team) => {
			const matchScouting = await getTeamScouting(team.tba.team_number, eventKey);
			return matchScouting
				.map((s) => z.array(z.string()).parse(JSON.parse(s.data.checks)))
				.flat()
				.join('\n ');
		}, (team: Team) => `checks_${team.tba.team_number}`);

		const getSecondsNotMoving = memoize(async (team: Team) => {
			const matchScouting = await getTeamScouting(team.tba.team_number, eventKey);
			return average(
				matchScouting.map((s) =>
					Trace.secondsNotMoving(TraceSchema.parse(JSON.parse(s.data.trace)) as TraceArray, false)
				)
			);
		}, (team: Team) => `secondsNotMoving_${team.tba.team_number}`);

		// Memoize team status calls to reduce API calls
		const getTeamStatus = memoize(async (team: Team) => {
			return (await team.getStatus()).unwrap()?.qual?.ranking.rank;
		}, (team: Team) => `teamStatus_${team.tba.team_number}`);

		const average = (array: number[]): number => {
			if (array.length === 0) return 0;
			return array.reduce((a, b) => a + b, 0) / array.length;
		};

		const yearBreakdown = Trace.score.yearBreakdown[2025];

		const t = new Table(eventKey);
		t.column('Team Number', (t) => t.tba.team_number);
		t.column('Team Name', (t) => t.tba.nickname || 'unknown');
		t.column('Rank', (t) => getTeamStatus(t));
		t.column('Average velocity', (t) => getAverageVelocity(t));
		t.column('Checks', (t) => getChecks(t));
		t.column('Weight', async (t) => {
			return getPitScouting('robot_weight', t);
		});
		t.column('Height', async (t) => {
			return getPitScouting('robot_height', t);
		});
		t.column('Width', async (t) => {
			return getPitScouting('robot_width', t);
		});
		t.column('Length', async (t) => {
			return getPitScouting('robot_length', t);
		});
		t.column('Drivetrain', async (t) => {
			return getPitScouting('robot_drivetrain', t);
		});
		t.column('Driver Practice', async (t) => {
			return getPitScouting('robot_drive_practice', t);
		});
		t.column('Programming Language', async (t) => {
			return getPitScouting('programmingLanguage', t);
		});
		t.column('Electrical Rating', async (t) => {
			return getPitScouting('robot_electrical_rating', t);
		});
		t.column('Pit Scouting Observations', async (t) => {
			return getPitScouting('observations', t);
		});
		t.column('Average Score Contribution', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s) => s.total));
		});
		t.column('Max Score Contribution', async (t) => {
			const scores = await getScores(t);
			return Math.max(...scores.traceScore.map((s) => s.total));
		});
		t.column('Average Auto Score', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s) => s.auto.total));
		});
		t.column('Max Auto Score', async (t) => {
			const scores = await getScores(t);
			return Math.max(...scores.traceScore.map((s) => s.auto.total));
		});
		t.column('Average Teleop Score', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s) => s.teleop.total));
		});
		t.column('Average Endgame Score', async (t) => {
			const scores = await getScores(t);
			return average(scores.endgame.map((s) => s.dpc + s.shc + s.park));
		});
		t.column('Max Endgame Score', async (t) => {
			const scores = await getScores(t);
			return Math.max(...scores.endgame.map((s) => s.dpc + s.shc + s.park));
		});
		t.column('Average Coral L1 Points Per Match', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s) => s.auto.cl1 + s.teleop.cl1));
		});
		t.column('Average Coral L2 Points Per Match', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s) => s.auto.cl2 + s.teleop.cl2));
		});
		t.column('Average Coral L3 Points Per Match', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s) => s.auto.cl3 + s.teleop.cl3));
		});
		t.column('Average Coral L4 Points Per Match', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s) => s.auto.cl4 + s.teleop.cl4));
		});
		t.column('Average Processor Points Per Match', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s) => s.auto.prc + s.teleop.prc));
		});
		t.column('Average Barge Points Per Match', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s) => s.auto.brg + s.teleop.brg));
		});
		t.column('Average Coral L1 Placed Per Match', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s) => s.auto.cl1 / yearBreakdown.auto.cl1 + s.teleop.cl1 / yearBreakdown.auto.cl1
				)
			);
		});
		t.column('Average Coral L2 Placed Per Match', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s) => s.auto.cl2 / yearBreakdown.auto.cl2 + s.teleop.cl2 / yearBreakdown.auto.cl2
				)
			);
		});
		t.column('Average Coral L3 Placed Per Match', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s) => s.auto.cl3 / yearBreakdown.auto.cl3 + s.teleop.cl3 / yearBreakdown.auto.cl3
				)
			);
		});
		t.column('Average Coral L4 Placed Per Match', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s) => s.auto.cl4 / yearBreakdown.auto.cl4 + s.teleop.cl4 / yearBreakdown.auto.cl4
				)
			);
		});
		t.column('Average Processor Placed Per Match', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s) => s.auto.prc / yearBreakdown.auto.prc + s.teleop.prc / yearBreakdown.auto.prc
				)
			);
		});
		t.column('Average Barge Placed Per Match', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s) => s.auto.brg / yearBreakdown.auto.brg + s.teleop.brg / yearBreakdown.auto.brg
				)
			);
		});
		t.column('Max Overall Coral Points', async (t) => {
			const scores = await getScores(t);
			return Math.max(
				...scores.traceScore.map(
					(s) =>
						s.auto.cl1 +
						s.auto.cl2 +
						s.auto.cl3 +
						s.auto.cl4 +
						s.teleop.cl1 +
						s.teleop.cl2 +
						s.teleop.cl3 +
						s.teleop.cl4
				)
			);
		});
		t.column('Max Overall Processor Points', async (t) => {
			const scores = await getScores(t);
			return Math.max(...scores.traceScore.map((s) => s.auto.prc + s.teleop.prc));
		});
		t.column('Max Overall Barge Points', async (t) => {
			const scores = await getScores(t);
			return Math.max(...scores.traceScore.map((s) => s.auto.brg + s.teleop.brg));
		});
		t.column('Average Overall Coral Points', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s) =>
						s.auto.cl1 +
						s.auto.cl2 +
						s.auto.cl3 +
						s.auto.cl4 +
						s.teleop.cl1 +
						s.teleop.cl2 +
						s.teleop.cl3 +
						s.teleop.cl4
				)
			);
		});
		t.column('Average Overall Processor Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s) => s.auto.prc + s.teleop.prc));
		});
		t.column('Average Overall Barge Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s) => s.auto.brg + s.teleop.brg));
		});
		t.column('Average Shallow Climb Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.endgame.map((s) => s.shc));
		});
		t.column('Average Deep Climb Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.endgame.map((s) => s.dpc));
		});
		t.column('Average Park Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.endgame.map((s) => s.park));
		});
		// these next 3 might not be necessary, but I feel it would be nice to have. could be good for tatorscore calc, can weight the total climbs against the total matches
		t.column('Total Deep Climbs', async (t) => {
			const scores = await getScores(t);
			return scores.endgame.filter((s) => s.dpc > 0).length;
		});
		t.column('Total Shallow Climbs', async (t) => {
			const scores = await getScores(t);
			return scores.endgame.filter((s) => s.shc > 0).length;
		});
		t.column('Total Parks', async (t) => {
			const scores = await getScores(t);
			return scores.endgame.filter((s) => s.park > 0).length;
		});
		t.column('Total Matches', async (t) => {
			const scores = await getScores(t);
			return scores.endgame.length;
		});
		t.column('Average Endgame Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.endgame.map((s) => s.dpc + s.shc + s.park));
		});
		t.column('Average Mobility Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.mobility);
		});
		t.column('Seconds not moving', (t) => getSecondsNotMoving(t));
		t.column('Average Score Contribution Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s) => s.total));
		});
		t.column('Max Score Contribution Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s) => s.total));
		});
		t.column('Average Auto Score Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s) => s.auto.total));
		});
		t.column('Max Auto Score Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s) => s.auto.total));
		});
		t.column('Average Teleop Score Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s) => s.teleop.total));
		});
		t.column('Average Coral L1 Points Per Match Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s) => s.auto.cl1 + s.teleop.cl1));
		});
		t.column('Average Coral L2 Points Per Match Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s) => s.auto.cl2 + s.teleop.cl2));
		});
		t.column('Average Coral L3 Points Per Match Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s) => s.auto.cl3 + s.teleop.cl3));
		});
		t.column('Average Coral L4 Points Per Match Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s) => s.auto.cl4 + s.teleop.cl4));
		});
		t.column('Average Processor Points Per Match Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s) => s.auto.prc + s.teleop.prc));
		});
		t.column('Average Barge Points Per Match Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s) => s.auto.brg + s.teleop.brg));
		});
		t.column('Max Coral L1 Points Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s) => s.auto.cl1 + s.teleop.cl1));
		});
		t.column('Max Coral L2 Points Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s) => s.auto.cl2 + s.teleop.cl2));
		});
		t.column('Max Coral L3 Points Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s) => s.auto.cl3 + s.teleop.cl3));
		});
		t.column('Max Coral L4 Points Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s) => s.auto.cl4 + s.teleop.cl4));
		});
		t.column('Max Processor Points Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s) => s.auto.prc + s.teleop.prc));
		});
		t.column('Max Barge Points Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s) => s.auto.brg + s.teleop.brg));
		});
		return t;
	});
};

export class Table {
	public readonly columns: Column<ColType>[] = [];

	constructor(public readonly eventKey: string) {}

	public column<T extends ColType>(name: string, fn: (team: Team) => T | Promise<T>): Column<T> {
		if (this.columns.find((c) => c.name === name))
			throw new Error(`Column ${name} already exists in table ${this.eventKey}`);
		const c = new Column<T>(this, name, this.columns.length, fn);
		this.columns.push(c);
		return c;
	}

	serialize() {
		// TODO: Use multi-threading instead of Promise.all
		// Note: The memoization optimizations in column functions will automatically
		// reduce redundant calls when this method processes teams in parallel
		return attemptAsync(async () => {
			const event = (await Event.getEvent(this.eventKey)).unwrap();
			const teams = (await event.getTeams()).unwrap();
			return [
				this.columns.map((c) => c.name),
				...(await Promise.all(
					teams.map(async (t) => {
						return Promise.all(
							this.columns.map(async (c) => {
								try {
									const res = await c.fn(t);
									if (typeof res === 'number') return res.toFixed(2);
									if (typeof res === 'string' && !isNaN(Number(res))) return Number(res).toFixed(2);
									return res;
								} catch (error) {
									terminal.error(
										'Error serializing column',
										JSON.stringify({ column: c.name, error })
									);
									return 'Error';
								}
							})
						);
					})
				))
			];
		});
	}
}

class Column<T extends ColType> {
	constructor(
		public readonly table: Table,
		public readonly name: string,
		public readonly index: number,
		public readonly fn: (team: Team) => T | Promise<T>
	) {}
}
