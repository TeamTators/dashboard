import { Cache } from '$lib/server/structs/cache.js';
import { Scouting } from '$lib/server/structs/scouting';
import * as TBA from '$lib/server/utils/tba';
import terminal from '$lib/server/utils/terminal.js';
import { redirect, fail } from '@sveltejs/kit';
import { EventSchema, TeamSchema, teamsFromMatch } from 'tatorscout/tba';
import { Trace, TraceSchema, type TraceArray } from 'tatorscout/trace';
import { $Math } from 'ts-utils/math';
import { ServerCode } from 'ts-utils/status';
import z from 'zod';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const cache = await Cache.get('event-summary', event.params.eventKey, z.object({
		event: EventSchema,
		teams: z.array(TeamSchema),
		summaries: z.array(z.object({
			labels: z.array(z.string()),
			title: z.string(),
			data: z.record(z.union([z.string(), z.number()]), z.array(z.number())),
		})),
	})).unwrap();

	if (cache) {
		return cache;
	}

	const e = await TBA.Event.getEvent(event.params.eventKey);
	if (e.isErr()) {
		throw fail(404);
	}

	const [teams, matches] = await Promise.all([e.value.getTeams(), e.value.getMatches()]);

	if (teams.isErr()) throw fail(ServerCode.internalServerError);
	if (matches.isErr()) throw fail(ServerCode.internalServerError);

	const scouting = (
		await Scouting.MatchScouting.fromProperty('eventKey', event.params.eventKey, {
			type: 'stream'
		}).await()
	).unwrap();

	const teamTraces: {
		number: number;
		traces: {
			trace: TraceArray;
			alliance: 'red' | 'blue';
		}[];
	}[] = teams.value.map((t) => ({
		number: t.tba.team_number,
		traces: scouting
			.filter((s) => s.data.team === t.tba.team_number)
			.map((s) => ({
				trace: TraceSchema.parse(JSON.parse(s.data.trace)) as TraceArray,
				alliance: s.data.alliance === 'red' ? 'red' : 'blue'
			}))
	}));

	const data: {
		number: number;
		data: {
			title: string;
			labels: string[];
			data: number[];
		}[];
	}[] = teamTraces.map((t) => {
		try {
			return {
				number: t.number,
				data:
					Trace.yearInfo[e.value.tba.year as keyof typeof Trace.yearInfo]?.summarize(t.traces) || []
			};
		} catch (error) {
			console.error(error);
			return {
				number: t.number,
				data: []
			};
		}
	});
	type Summary = {
		labels: string[];
		title: string;
		data: {
			[key: number]: number[];
		};
	};

	const summaries: Summary[] = [];

	const [team] = data;

	if (team) {
		summaries.push(
			...team.data.map((d) => ({
				title: d.title,
				labels: d.labels,
				data: {}
			}))
		);
	}

	for (const team of data) {
		for (const d of team.data) {
			const found = summaries.find((r) => r.title === d.title);
			if (!found) continue;
			found.data[team.number] = d.data;
		}
	}

	const auto = summaries.find((r) => r.title === 'Auto Points');
	if (auto) {
		auto.labels = ['Mobility', 'Coral', 'Algae', 'Total'];
		auto.data = Object.fromEntries(
			Object.entries(auto.data).map(([k, v]) => {
				let mobility = 0;
				try {
					mobility = $Math.average(
						matches.value
							.filter((m) => teamsFromMatch(m.tba).includes(parseInt(k)))
							.map((m) => {
								const match2025Res = m.asYear(2025);
								if (match2025Res.isOk()) {
									const match2025 = match2025Res.value;
									const redPosition = match2025.alliances.red.team_keys.indexOf(`frc${k}`);
									const bluePosition = match2025.alliances.blue.team_keys.indexOf(`frc${k}`);
									const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
									const position =
										alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
									// let endgamePoints = 0;
									let autoPoints = 0;
									if (alliance) {
										const mobilityRobots = [
											match2025.score_breakdown[alliance].autoLineRobot1,
											match2025.score_breakdown[alliance].autoLineRobot2,
											match2025.score_breakdown[alliance].autoLineRobot3
										];

										autoPoints = 3 * Number(mobilityRobots[position] === 'Yes');

										// const endgameRobots = [
										// 	match2025.score_breakdown[alliance].endGameRobot1, // Parked, DeepClimb, ShallowClimb
										// 	match2025.score_breakdown[alliance].endGameRobot2,
										// 	match2025.score_breakdown[alliance].endGameRobot3,
										// ];

										// endgamePoints = matchCase<string, number>(endgameRobots[position])
										// 	.case('Parked', () => 2)
										// 	.case('ShallowCage', () => 6)
										// 	.case('DeepCage', () => 12)
										// 	.default(() => 0)
										// 	.exec()
										// 	.unwrap();
									}
									return autoPoints;
								}
								return 0;
							})
					);
				} catch (error) {
					terminal.error(error);
				}
				return [k, [mobility, v[0], v[1], v[2]]];
			})
		) as { [key: number]: number[] };
	}

	const endgame: Summary = {
		title: 'Endgame',
		labels: ['Park', 'Shallow', 'Deep'],
		data: {}
	};

	endgame.data = Object.fromEntries(
		Object.entries(auto?.data || {}).map(([k, _v]) => {
			let park = 0;
			let shallow = 0;
			let deep = 0;
			let total = 0;
			try {
				const match2025Res = matches.value
					.filter((m) => teamsFromMatch(m.tba).includes(parseInt(k)))
					.map((m) => {
						const match2025Res = m.asYear(2025);
						if (match2025Res.isOk()) {
							const match2025 = match2025Res.value;
							const redPosition = match2025.alliances.red.team_keys.indexOf(`frc${k}`);
							const bluePosition = match2025.alliances.blue.team_keys.indexOf(`frc${k}`);
							const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
							const position =
								alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
							if (alliance) {
								const endgameRobots = [
									match2025.score_breakdown[alliance].endGameRobot1, // Parked, DeepClimb, ShallowClimb
									match2025.score_breakdown[alliance].endGameRobot2,
									match2025.score_breakdown[alliance].endGameRobot3
								];

								return {
									park: endgameRobots[position] === 'Parked',
									shallow: endgameRobots[position] === 'ShallowCage',
									deep: endgameRobots[position] === 'DeepCage'
								};
							}
						}
						return {
							park: false,
							shallow: false,
							deep: false
						};
					});

				park = $Math.average(match2025Res.map((m) => (m.park ? 2 : 0)));
				shallow = $Math.average(match2025Res.map((m) => (m.shallow ? 6 : 0)));
				deep = $Math.average(match2025Res.map((m) => (m.deep ? 12 : 0)));
				total = park + shallow + deep;
			} catch (error) {
				terminal.error(error);
			}
			return [k, [park, shallow, deep, total]];
		})
	) as { [key: number]: number[] };

	summaries.push(endgame);

	const total = summaries.find((r) => r.title === 'Total Points');
	if (total) {
		// include auto and endgame
		total.labels = ['Total'];
		total.data = Object.fromEntries(
			Object.entries(total.data).map(([k, v]) => {
				const autoPoints = auto?.data[parseInt(k)][3] || 0;
				const endgamePoints = endgame.data[parseInt(k)][3] || 0;
				return [k, [v[0] + autoPoints + endgamePoints]];
			})
		);
	}

	const obj =  {
		event: e.value.tba,
		teams: teams.value.map((t) => t.tba),
		summaries
	};

	Cache.set(
		'event-summary', 
		event.params.eventKey, 
		obj,
		new Date(Date.now() + 1000 * 60),
	);

	return obj;
};
