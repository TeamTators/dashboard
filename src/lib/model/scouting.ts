import { type DataArr } from '$lib/services/struct/data-arr';
import { Struct } from '$lib/services/struct';
import { type StructDataVersion, type StructData } from '$lib/services/struct';
import { sse } from '../services/sse';
import { browser } from '$app/environment';
import { attempt, attemptAsync } from 'ts-utils/check';
import { z } from 'zod';
import { Account } from './account';
import { Trace, TraceSchema, type TraceArray } from 'tatorscout/trace';
import { $Math } from 'ts-utils/math';
import type { TBAMatch } from '$lib/utils/tba';
import { teamsFromMatch } from 'tatorscout/tba';
import { match } from 'ts-utils/match';

export namespace Scouting {
	export const MatchScouting = new Struct({
		name: 'match_scouting',
		structure: {
			eventKey: 'string',
			matchNumber: 'number',
			compLevel: 'string',
			// matchId: 'string',
			team: 'number',
			scoutId: 'string',
			scoutGroup: 'number',
			prescouting: 'boolean',
			remote: 'boolean',
			trace: 'string',
			checks: 'string',
			scoutUsername: 'string',
			alliance: 'string',
			year: 'number',
			sliders: 'string'
		},
		socket: sse,
		browser
	});

	export type MatchScoutingData = StructData<typeof MatchScouting.data.structure>;
	export type MatchScoutingArr = DataArr<typeof MatchScouting.data.structure>;
	export type MatchScoutingHistory = StructDataVersion<typeof MatchScouting.data.structure>;

	export const getAverageVelocity = (data: MatchScoutingData[]) => {
		return Trace.velocity.average(
			data.map((d) => TraceSchema.parse(JSON.parse(d.data.trace || '[]'))).flat() as TraceArray
		);
	};

	export const getArchivedMatches = (team: number, eventKey: string) => {
		return MatchScouting.query(
			'archived-matches',
			{ team, eventKey },
			{
				asStream: false,
				satisfies: (d) => d.data.team === team && d.data.eventKey === eventKey && !!d.data.archived
			}
		);
	};

	export const averageAutoScore = (data: MatchScoutingData[], year: number) => {
		return attempt(() => {
			if (year === 2025) {
				return $Math.average(
					data.map(
						(d) =>
							Trace.score.parse2025(
								TraceSchema.parse(JSON.parse(d.data.trace || '[]')) as TraceArray,
								d.data.alliance as 'red' | 'blue'
							).auto.total
					)
				);
			}
			return 0;
		});
	};

	export const averageTeleopScore = (data: MatchScoutingData[], year: number) => {
		return attempt(() => {
			if (year === 2025) {
				const teles = data.map(
					(d) =>
						Trace.score.parse2025(
							TraceSchema.parse(JSON.parse(d.data.trace || '[]')) as TraceArray,
							d.data.alliance as 'red' | 'blue'
						).teleop
				);

				return $Math.average(teles.map((t) => t.total));
			}
			return 0;
		});
	};

	export const averageEndgameScore = (matches: TBAMatch[], team: number, year: number) => {
		return attempt(() => {
			if (year === 2025) {
				const endgames = matches
					.filter((m) => teamsFromMatch(m.tba).includes(team))
					.map((m) => {
						const match2025 = m.asYear(2025).unwrap();
						const redPosition = match2025.alliances.red.team_keys.indexOf(`frc${team}`);
						const bluePosition = match2025.alliances.blue.team_keys.indexOf(`frc${team}`);
						const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
						const position =
							alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
						if (alliance) {
							const endgameRobots = [
								match2025.score_breakdown[alliance].endGameRobot1, // Parked, DeepClimb, ShallowClimb
								match2025.score_breakdown[alliance].endGameRobot2,
								match2025.score_breakdown[alliance].endGameRobot3
							];

							return match<string, number>(endgameRobots[position])
								.case('Parked', () => 2)
								.case('ShallowCage', () => 6)
								.case('DeepCage', () => 12)
								.default(() => 0)
								.exec()
								.unwrap();
						}

						return 0;
					});

				return $Math.average(endgames);
			}

			return 0;
		});
	};

	export interface Contribution {
		cl1: number;
		cl2: number;
		cl3: number;
		cl4: number;
		brg: number;
		prc: number;
		shc: number;
		dpc: number;
		prk: number;
	}

	export const averageContributions = (data: MatchScoutingData[]): Contribution => {
		return attempt(() => {
			const coralCounts = data.map((d) => {
				const trace = TraceSchema.parse(JSON.parse(d.data.trace || '[]'));

				const actionObj = trace.reduce(
					(acc, curr) => {
						if (!curr[3]) return acc;
						if (['cl1', 'cl2', 'cl3', 'cl4', 'brg', 'prc', 'shc', 'dpc', 'prk'].includes(curr[3])) {
							acc[curr[3]] = (acc[curr[3]] || 0) + 1;
						}
						return acc;
					},
					{} as Record<string, number>
				);

				console.log('trace', trace);

				return actionObj;
			});

			const totalActions = coralCounts.reduce(
				(acc, curr) => {
					Object.entries(curr).forEach(([key, value]) => {
						acc[key] = (acc[key] || 0) + value;
					});
					return acc;
				},
				{} as Record<string, number>
			);

			const count = coralCounts.length;
			const averages = Object.fromEntries(
				Object.entries(totalActions).map(([key, value]) => [key, value / count])
			);

			return {
				cl1: averages.cl1 || 0,
				cl2: averages.cl2 || 0,
				cl3: averages.cl3 || 0,
				cl4: averages.cl4 || 0,
				brg: averages.brg || 0,
				prc: averages.prc || 0,
				shc: averages.shc || 0,
				dpc: averages.dpc || 0,
				prk: averages.prk || 0
			};
		}).unwrap();
	};

	export const averageSecondsNotMoving = (data: MatchScoutingData[]) => {
		return attempt(() => {
			return $Math.average(
				data.map((d) =>
					Trace.secondsNotMoving(
						TraceSchema.parse(JSON.parse(d.data.trace || '[]')) as TraceArray,
						false
					)
				)
			);
		});
	};

	export const scoutingFromTeam = (team: number, eventKey: string) => {
		return MatchScouting.query(
			'from-team',
			{ team, eventKey },
			{
				asStream: false,
				satisfies: (d) => d.data.team === team && d.data.eventKey === eventKey && !!d.data.archived
			}
		);
	};

	export const preScouting = (team: number, eventKey: string) => {
		return MatchScouting.query(
			'pre-scouting',
			{ team, eventKey },
			{
				asStream: false,
				satisfies: (d) =>
					d.data.team === team &&
					d.data.eventKey === eventKey &&
					!!d.data.archived &&
					!!d.data.prescouting
			}
		);
	};

	export const setPracticeArchive = (eventKey: string, archive: boolean) => {
		return MatchScouting.call('set-practice-archive', {
			eventKey,
			archive
		});
	};

	export const TeamComments = new Struct({
		name: 'team_comments',
		structure: {
			matchScoutingId: 'string',
			accountId: 'string',
			team: 'number',
			comment: 'string',
			type: 'string',
			eventKey: 'string',
			scoutUsername: 'string'
		},
		socket: sse,
		browser
	});

	export type TeamCommentsData = StructData<typeof TeamComments.data.structure>;
	export type TeamCommentsArr = DataArr<typeof TeamComments.data.structure>;

	export const parseTrace = (trace: string) => {
		return attempt<TraceArray>(() => {
			return z
				.array(z.tuple([z.number(), z.number(), z.number(), z.string()]))
				.parse(JSON.parse(trace)) as TraceArray;
		});
	};

	export namespace PIT {
		export const Sections = new Struct({
			name: 'pit_sections',
			structure: {
				name: 'string',
				order: 'number',
				eventKey: 'string',
				allowMultiple: 'boolean',
			},
			socket: sse,
			browser
		});

		export type SectionData = StructData<typeof Sections.data.structure>;
		export type SectionArr = DataArr<typeof Sections.data.structure>;

		export const Groups = new Struct({
			name: 'pit_groups',
			structure: {
				sectionId: 'string',
				name: 'string',
				order: 'number'
			},
			socket: sse,
			browser
		});

		export type GroupData = StructData<typeof Groups.data.structure>;
		export type GroupArr = DataArr<typeof Groups.data.structure>;

		export const Questions = new Struct({
			name: 'pit_questions',
			structure: {
				groupId: 'string',
				question: 'string',
				description: 'string',
				type: 'string',
				key: 'string',
				order: 'number',
				options: 'string'
			},
			socket: sse,
			browser
		});

		export type QuestionData = StructData<typeof Questions.data.structure>;
		export type QuestionArr = DataArr<typeof Questions.data.structure>;

		export const Answers = new Struct({
			name: 'pit_answers',
			structure: {
				questionId: 'string',
				answer: 'string',
				team: 'number',
				accountId: 'string',
				session: 'string',
			},
			socket: sse,
			browser
		});

		export type AnswerData = StructData<typeof Answers.data.structure>;
		export type AnswerArr = DataArr<typeof Answers.data.structure>;

		export const AnswerSessions = new Struct({
			name: 'pit_answer_sessions',
			structure: {
				section: 'string',
				createdBy: 'string',
				answers: 'number',
			},
			socket: sse,
			browser,
		});

		export type AnswerSessionsData = typeof AnswerSessions.sample;

		export type Options = {};

		export const parseOptions = (question: QuestionData) => {
			return attempt(() => {
				const options = question.data.options;
				if (!options) throw new Error('No options key');
				return z.array(z.string()).parse(JSON.parse(options));
			});
		};

		export const parseAnswer = (answer: AnswerData) => {
			return attempt(() => {
				const value = answer.data.answer;
				if (!value) throw new Error('No answer key');
				return z.array(z.string()).parse(JSON.parse(value));
			});
		};

		export const getAnswersFromGroup = (group: GroupData, questionIDs: string[]) => {
			return Answers.query(
				'from-group',
				{
					group: group.data.id
				},
				{
					asStream: false,
					satisfies: (d) => (d.data.questionId ? questionIDs.includes(d.data.questionId) : false)
				}
			);
		};

		export const answerQuestion = (
			question: QuestionData,
			answer: string[],
			team: number,
			account: Account.AccountData,
			session: string,
		) => {
			return attemptAsync(async () => {
				if (!question.data.id) throw new Error('Question ID not found');
				const accountId = account.data.id;
				if (!accountId) throw new Error('Account ID not found');
				const res = (
					await Answers.new({
						questionId: question.data.id,
						answer: JSON.stringify(answer),
						team,
						accountId,
						session
					})
				).unwrap();

				if (!res.success) throw new Error(res.message || 'Failed to answer question');
			});
		};
	}
}
