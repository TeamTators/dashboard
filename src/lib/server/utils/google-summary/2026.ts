import { attemptAsync } from 'ts-utils/check';
import { Event, Team } from '../tba';
import { z } from 'zod';
import { Scouting } from '../../structs/scouting';
import terminal from '../terminal';
import { DB } from '../../db';
import { and, eq } from 'drizzle-orm';
import { teamsFromMatch } from 'tatorscout/tba';
import YearInfo2026 from 'tatorscout/years/2026.js';
import { Table } from '.';

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


export const summarize = (eventKey: string) => {
    return attemptAsync(async () => {
        const t = new Table(eventKey);
        const event = (await Event.getEvent(eventKey)).unwrap();
        const matches = (await event.getMatches()).unwrap();

        if (event.tba.year !== 2025) throw new Error('Only 2025 events are currently supported');

        const cache = new Map<number, Scouting.MatchScoutingExtended[]>();

        const getAllScouting = async (team: Team) => {
            const cached = cache.get(team.tba.team_number);
            if (cached) return cached;
            const matchScouting = (
                await Scouting.getTeamScouting(team.tba.team_number, event.tba.key)
            ).unwrap();
            const data = matchScouting.map((s) => Scouting.MatchScoutingExtended.from(s).unwrap());
            cache.set(team.tba.team_number, data);
            return data;
        };

        // Memoized version of getScores to cache results per team
        const getScores = memoize(
            async (team: Team) => {
                try {
                    const scouting = await getAllScouting(team);
                    if (!scouting) throw new Error('No traces found');
                    const teamMatches = matches.filter((m) =>
                        teamsFromMatch(m.tba).includes(team.tba.team_number)
                    );
                    if (teamMatches.length === 0) throw new Error('No matches found');

                    // TODO: include tba climb and mobility score here
                    // Return a new object with { traceScore: (current score), endgame: number, mobility: number }
                    // For each of the listeners below, you'll need to do `scores.map(s => s.traceScore.something)` instead of `scores.map(s => s.something)`
                    // Then, fill out the blank columns below with the appropriate values

                    const traceScore = scouting.map((t) => YearInfo2026.parse(t.trace));

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
            },
            (team: Team) => `getScores_${team.tba.team_number}`
        );

        // Memoized version of getScoresWithoutDefense to cache results per team
        const getScoresWithoutDefense = memoize(
            async (team: Team) => {
                try {
                    const traces = await getAllScouting(team);
                    if (!traces) throw new Error('No traces found');
                    const teamMatches = matches.filter((m) =>
                        teamsFromMatch(m.tba).includes(team.tba.team_number)
                    );
                    if (teamMatches.length === 0) throw new Error('No matches found');

                    const traceScore = traces
                        .map((t) => {
                            if (!t.getChecks().unwrap().includes('defense')) {
                                // return Trace.score.parse2025(
                                // 	t.trace,
                                // 	(t.match.data.alliance || 'red') as 'red' | 'blue'
                                // );
                                return YearInfo2026.parse(t.trace);
                            }
                        })
                        .filter((score) => score !== undefined); // Remove undefined values

                    return { traceScore };
                } catch (error) {
                    terminal.error(`Error pulling scores for team ${team.tba.team_number}`, error);
                    throw error;
                }
            },
            (team: Team) => `getScoresWithoutDefense_${team.tba.team_number}`
        );

        // Memoized version of getPitScouting to cache results per team and question
        const getPitScouting = memoize(
            async (requestedQuestion: string, team: Team) => {
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
            },
            (requestedQuestion: string, team: Team) =>
                `getPitScouting_${requestedQuestion}_${team.tba.team_number}`
        );

        // Memoize expensive velocity and scouting calculations
        const getTeamScouting = memoize(
            async (teamNumber: number, eventKey: string) => {
                const scoutingArr = await Scouting.getTeamScouting(teamNumber, eventKey).unwrap();
                return scoutingArr.map((s) => Scouting.MatchScoutingExtended.from(s).unwrap());
            },
            (teamNumber: number, eventKey: string) => `teamScouting_${teamNumber}_${eventKey}`
        );

        const getAverageVelocity = memoize(
            async (team: Team) => {
                const matchScouting = await getTeamScouting(team.tba.team_number, eventKey);
                return average(matchScouting.map((s) => s.averageVelocity));
            },
            (team: Team) => `averageVelocity_${team.tba.team_number}`
        );

        const getChecks = memoize(
            async (team: Team) => {
                const matchScouting = await getTeamScouting(team.tba.team_number, eventKey);
                return matchScouting
                    .map((s) => s.getChecks().unwrap())
                    .flat()
                    .join('\n ');
            },
            (team: Team) => `checks_${team.tba.team_number}`
        );

        const getSecondsNotMoving = memoize(
            async (team: Team) => {
                const matchScouting = await getTeamScouting(team.tba.team_number, eventKey);
                return average(matchScouting.map((s) => s.secondsNotMoving));
            },
            (team: Team) => `secondsNotMoving_${team.tba.team_number}`
        );

        // Memoize team status calls to reduce API calls
        const getTeamStatus = memoize(
            async (team: Team) => {
                return (await team.getStatus()).unwrap()?.qual?.ranking.rank;
            },
            (team: Team) => `teamStatus_${team.tba.team_number}`
        );

        const average = (array: number[]): number => {
            if (array.length === 0) return 0;
            return array.reduce((a, b) => a + b, 0) / array.length;
        };

        const standardDeviation = (array: number[]): number => {
            if (array.length === 0) return 0;
            const mean = average(array);
            const squaredDifferences = array.map((value) => Math.pow(value - mean, 2));
            const variance = average(squaredDifferences);
            return Math.sqrt(variance);
        };
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
        t.column('StdDev Score Contribution', async (t) => {
            const scores = await getScores(t);
            return standardDeviation(scores.traceScore.map((s) => s.total));
        });
        t.column('Max Score Contribution', async (t) => {
            const scores = await getScores(t);
            return Math.max(...scores.traceScore.map((s) => s.total));
        });
        t.column('Average Auto Score', async (t) => {
            const scores = await getScores(t);
            return average(scores.traceScore.map((s) => s.auto.total));
        });
        t.column('StdDev Auto Score', async (t) => {
            const scores = await getScores(t);
            return standardDeviation(scores.traceScore.map((s) => s.auto.total));
        });
        t.column('Max Auto Score', async (t) => {
            const scores = await getScores(t);
            return Math.max(...scores.traceScore.map((s) => s.auto.total));
        });
        t.column('Average Teleop Score', async (t) => {
            const scores = await getScores(t);
            return average(scores.traceScore.map((s) => s.teleop.total));
        });
        t.column('StdDev Teleop Score', async (t) => {
            const scores = await getScores(t);
            return standardDeviation(scores.traceScore.map((s) => s.teleop.total));
        });
        t.column('Average Endgame Score', async (t) => {
            const scores = await getScores(t);
            return average(scores.endgame.map((s) => s.dpc + s.shc + s.park));
        });
        t.column('StdDev Endgame Score', async (t) => {
            const scores = await getScores(t);
            return standardDeviation(scores.endgame.map((s) => s.dpc + s.shc + s.park));
        });
        t.column('Max Endgame Score', async (t) => {
            const scores = await getScores(t);
            return Math.max(...scores.endgame.map((s) => s.dpc + s.shc + s.park));
        });
        return t;
    });
};