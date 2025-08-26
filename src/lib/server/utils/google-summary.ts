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
       // Memoization cache for per-team/column results within a single summarize call
       const memo = new Map<string, any>();
       // Helper to memoize async column functions by team and column name
       const memoize = async (team: Team, col: string, fn: () => Promise<any>) => {
	       const key = `${team.tba.team_number}:${col}`;
	       if (memo.has(key)) return memo.get(key);
	       const val = await fn();
	       memo.set(key, val);
	       return val;
       };
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

		const getScores = async (team: Team) => {
			try {
		       // Memoize all expensive per-team computations
		       return memoize(team, 'getScores', async () => {
			       const traces = await getAllTraces(team);
			       if (!traces) throw new Error('No traces found');
			       const teamMatches = matches.filter((m) =>
				       teamsFromMatch(m.tba).includes(team.tba.team_number)
			       );
			       if (teamMatches.length === 0) throw new Error('No matches found');

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
		       });
			} catch (error) {
				terminal.error(`Error pulling scores for team ${team.tba.team_number}`, error);
				throw error;
			}
		};

		const getScoresWithoutDefense = async (team: Team) => {
			try {
		       // Memoize all expensive per-team computations
		       return memoize(team, 'getScoresWithoutDefense', async () => {
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
		       });
			} catch (error) {
				terminal.error(`Error pulling scores for team ${team.tba.team_number}`, error);
				throw error;
			}
		};

		const getPitScouting = async (requestedQuestion: string, team: Team) => {
			try {
		       // Memoize pit scouting answers per team/question
		       return memoize(team, `pit:${requestedQuestion}`, async () => {
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
		       });
			} catch (error) {
				terminal.error(`Error pulling pitscouting for team: ${team}`, error);
				throw error;
			}
		};

		const average = (array: number[]): number => {
			if (array.length === 0) return 0;
			return array.reduce((a, b) => a + b, 0) / array.length;
		};

		const yearBreakdown = Trace.score.yearBreakdown[2025];

		const t = new Table(eventKey, memo, memoize);
		t.column('Team Number', (t) => t.tba.team_number);
		t.column('Team Name', (t) => t.tba.nickname || 'unknown');
		t.column('Rank', (t) => t.getStatus().then((s) => s.unwrap()?.qual?.ranking.rank));
		t.column('Average velocity', async (t) => {
			const matchScouting = (await Scouting.getTeamScouting(t.tba.team_number, eventKey)).unwrap();
			return average(
				matchScouting.map((s) =>
					Trace.velocity.average(TraceSchema.parse(JSON.parse(s.data.trace)) as TraceArray)
				)
			);
		});
		t.column('Checks', async (t) => {
			const matchScouting = (await Scouting.getTeamScouting(t.tba.team_number, eventKey)).unwrap();
			return matchScouting
				.map((s) => z.array(z.string()).parse(JSON.parse(s.data.checks)))
				.flat()
				.join('\n ');
		});
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
			return average(scores.traceScore.map((s: { total: any; }) => s.total));
		});
		t.column('Max Score Contribution', async (t) => {
			const scores = await getScores(t);
			return Math.max(...scores.traceScore.map((s: { total: any; }) => s.total));
		});
		t.column('Average Auto Score', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s: { auto: { total: any; }; }) => s.auto.total));
		});
		t.column('Max Auto Score', async (t) => {
			const scores = await getScores(t);
			return Math.max(...scores.traceScore.map((s: { auto: { total: any; }; }) => s.auto.total));
		});
		t.column('Average Teleop Score', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s: { teleop: { total: any; }; }) => s.teleop.total));
		});
		t.column('Average Endgame Score', async (t) => {
			const scores = await getScores(t);
			return average(scores.endgame.map((s: { dpc: any; shc: any; park: any; }) => s.dpc + s.shc + s.park));
		});
		t.column('Max Endgame Score', async (t) => {
			const scores = await getScores(t);
			return Math.max(...scores.endgame.map((s: { dpc: any; shc: any; park: any; }) => s.dpc + s.shc + s.park));
		});
		t.column('Average Coral L1 Points Per Match', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s: { auto: { cl1: any; }; teleop: { cl1: any; }; }) => s.auto.cl1 + s.teleop.cl1));
		});
		t.column('Average Coral L2 Points Per Match', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s: { auto: { cl2: any; }; teleop: { cl2: any; }; }) => s.auto.cl2 + s.teleop.cl2));
		});
		t.column('Average Coral L3 Points Per Match', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s: { auto: { cl3: any; }; teleop: { cl3: any; }; }) => s.auto.cl3 + s.teleop.cl3));
		});
		t.column('Average Coral L4 Points Per Match', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s: { auto: { cl4: any; }; teleop: { cl4: any; }; }) => s.auto.cl4 + s.teleop.cl4));
		});
		t.column('Average Processor Points Per Match', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s: { auto: { prc: any; }; teleop: { prc: any; }; }) => s.auto.prc + s.teleop.prc));
		});
		t.column('Average Barge Points Per Match', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s: { auto: { brg: any; }; teleop: { brg: any; }; }) => s.auto.brg + s.teleop.brg));
		});
		t.column('Average Coral L1 Placed Per Match', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s: { auto: { cl1: number; }; teleop: { cl1: number; }; }) => s.auto.cl1 / yearBreakdown.auto.cl1 + s.teleop.cl1 / yearBreakdown.auto.cl1
				)
			);
		});
		t.column('Average Coral L2 Placed Per Match', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s: { auto: { cl2: number; }; teleop: { cl2: number; }; }) => s.auto.cl2 / yearBreakdown.auto.cl2 + s.teleop.cl2 / yearBreakdown.auto.cl2
				)
			);
		});
		t.column('Average Coral L3 Placed Per Match', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s: { auto: { cl3: number; }; teleop: { cl3: number; }; }) => s.auto.cl3 / yearBreakdown.auto.cl3 + s.teleop.cl3 / yearBreakdown.auto.cl3
				)
			);
		});
		t.column('Average Coral L4 Placed Per Match', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s: { auto: { cl4: number; }; teleop: { cl4: number; }; }) => s.auto.cl4 / yearBreakdown.auto.cl4 + s.teleop.cl4 / yearBreakdown.auto.cl4
				)
			);
		});
		t.column('Average Processor Placed Per Match', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s: { auto: { prc: number; }; teleop: { prc: number; }; }) => s.auto.prc / yearBreakdown.auto.prc + s.teleop.prc / yearBreakdown.auto.prc
				)
			);
		});
		t.column('Average Barge Placed Per Match', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s: { auto: { brg: number; }; teleop: { brg: number; }; }) => s.auto.brg / yearBreakdown.auto.brg + s.teleop.brg / yearBreakdown.auto.brg
				)
			);
		});
		t.column('Max Overall Coral Points', async (t) => {
			const scores = await getScores(t);
			return Math.max(
				...scores.traceScore.map(
					(s: { auto: { cl1: any; cl2: any; cl3: any; cl4: any; }; teleop: { cl1: any; cl2: any; cl3: any; cl4: any; }; }) =>
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
			return Math.max(...scores.traceScore.map((s: { auto: { prc: any; }; teleop: { prc: any; }; }) => s.auto.prc + s.teleop.prc));
		});
		t.column('Max Overall Barge Points', async (t) => {
			const scores = await getScores(t);
			return Math.max(...scores.traceScore.map((s: { auto: { brg: any; }; teleop: { brg: any; }; }) => s.auto.brg + s.teleop.brg));
		});
		t.column('Average Overall Coral Points', async (t) => {
			const scores = await getScores(t);
			return average(
				scores.traceScore.map(
					(s: { auto: { cl1: any; cl2: any; cl3: any; cl4: any; }; teleop: { cl1: any; cl2: any; cl3: any; cl4: any; }; }) =>
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
			return average(scores.traceScore.map((s: { auto: { prc: any; }; teleop: { prc: any; }; }) => s.auto.prc + s.teleop.prc));
		});
		t.column('Average Overall Barge Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.traceScore.map((s: { auto: { brg: any; }; teleop: { brg: any; }; }) => s.auto.brg + s.teleop.brg));
		});
		t.column('Average Shallow Climb Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.endgame.map((s: { shc: any; }) => s.shc));
		});
		t.column('Average Deep Climb Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.endgame.map((s: { dpc: any; }) => s.dpc));
		});
		t.column('Average Park Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.endgame.map((s: { park: any; }) => s.park));
		});
		// these next 3 might not be necessary, but I feel it would be nice to have. could be good for tatorscore calc, can weight the total climbs against the total matches
		t.column('Total Deep Climbs', async (t) => {
			const scores = await getScores(t);
			return scores.endgame.filter((s: { dpc: number; }) => s.dpc > 0).length;
		});
		t.column('Total Shallow Climbs', async (t) => {
			const scores = await getScores(t);
			return scores.endgame.filter((s: { shc: number; }) => s.shc > 0).length;
		});
		t.column('Total Parks', async (t) => {
			const scores = await getScores(t);
			return scores.endgame.filter((s: { park: number; }) => s.park > 0).length;
		});
		t.column('Total Matches', async (t) => {
			const scores = await getScores(t);
			return scores.endgame.length;
		});
		t.column('Average Endgame Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.endgame.map((s: { dpc: any; shc: any; park: any; }) => s.dpc + s.shc + s.park));
		});
		t.column('Average Mobility Points', async (t) => {
			const scores = await getScores(t);
			return average(scores.mobility);
		});
		t.column('Seconds not moving', async (t) => {
			const matchScouting = (await Scouting.getTeamScouting(t.tba.team_number, eventKey)).unwrap();
			return average(
				matchScouting.map((s) =>
					Trace.secondsNotMoving(TraceSchema.parse(JSON.parse(s.data.trace)) as TraceArray, false)
				)
			);
		});
		t.column('Average Score Contribution Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s: { total: any; }) => s.total));
		});
		t.column('Max Score Contribution Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s: { total: any; }) => s.total));
		});
		t.column('Average Auto Score Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s: { auto: { total: any; }; }) => s.auto.total));
		});
		t.column('Max Auto Score Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s: { auto: { total: any; }; }) => s.auto.total));
		});
		t.column('Average Teleop Score Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s: { teleop: { total: any; }; }) => s.teleop.total));
		});
		t.column('Average Coral L1 Points Per Match Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s: { auto: { cl1: any; }; teleop: { cl1: any; }; }) => s.auto.cl1 + s.teleop.cl1));
		});
		t.column('Average Coral L2 Points Per Match Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s: { auto: { cl2: any; }; teleop: { cl2: any; }; }) => s.auto.cl2 + s.teleop.cl2));
		});
		t.column('Average Coral L3 Points Per Match Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s: { auto: { cl3: any; }; teleop: { cl3: any; }; }) => s.auto.cl3 + s.teleop.cl3));
		});
		t.column('Average Coral L4 Points Per Match Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s: { auto: { cl4: any; }; teleop: { cl4: any; }; }) => s.auto.cl4 + s.teleop.cl4));
		});
		t.column('Average Processor Points Per Match Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s: { auto: { prc: any; }; teleop: { prc: any; }; }) => s.auto.prc + s.teleop.prc));
		});
		t.column('Average Barge Points Per Match Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return average(scores.traceScore.map((s: { auto: { brg: any; }; teleop: { brg: any; }; }) => s.auto.brg + s.teleop.brg));
		});
		t.column('Max Coral L1 Points Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s: { auto: { cl1: any; }; teleop: { cl1: any; }; }) => s.auto.cl1 + s.teleop.cl1));
		});
		t.column('Max Coral L2 Points Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s: { auto: { cl2: any; }; teleop: { cl2: any; }; }) => s.auto.cl2 + s.teleop.cl2));
		});
		t.column('Max Coral L3 Points Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s: { auto: { cl3: any; }; teleop: { cl3: any; }; }) => s.auto.cl3 + s.teleop.cl3));
		});
		t.column('Max Coral L4 Points Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s: { auto: { cl4: any; }; teleop: { cl4: any; }; }) => s.auto.cl4 + s.teleop.cl4));
		});
		t.column('Max Processor Points Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s: { auto: { prc: any; }; teleop: { prc: any; }; }) => s.auto.prc + s.teleop.prc));
		});
		t.column('Max Barge Points Without Defense', async (t) => {
			const scores = await getScoresWithoutDefense(t);
			return Math.max(...scores.traceScore.map((s: { auto: { brg: any; }; teleop: { brg: any; }; }) => s.auto.brg + s.teleop.brg));
		});
		return t;
	});
};


export class Table {
       public readonly columns: Column<ColType>[] = [];
       private memo: Map<string, any>;
       private memoize: (team: Team, col: string, fn: () => Promise<any>) => Promise<any>;

       constructor(public readonly eventKey: string, memo?: Map<string, any>, memoize?: (team: Team, col: string, fn: () => Promise<any>) => Promise<any>) {
	       this.memo = memo || new Map();
	       this.memoize = memoize || (async (_team, _col, fn) => fn());
       }

       public column<T extends ColType>(name: string, fn: (team: Team) => T | Promise<T>): Column<T> {
	       if (this.columns.find((c) => c.name === name))
		       throw new Error(`Column ${name} already exists in table ${this.eventKey}`);
	       // Wrap fn with memoization for this column
	       const wrappedFn = (team: Team) => this.memoize(team, name, () => Promise.resolve(fn(team)));
	       const c = new Column<T>(this, name, this.columns.length, wrappedFn);
	       this.columns.push(c);
	       return c;
       }

       serialize() {
	       // TODO: Use multi-threading instead of Promise.all
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
	) { }
}
