/**
 * @fileoverview Scouting Struct models, helpers, and match upload utilities.
 *
 * @description
 * Provides client-side Structs for match scouting, team comments, and pit scouting, plus
 * helper classes and functions for analyzing scouting data and uploading match batches.
 */
import { type DataArr } from '$lib/services/struct/data-arr';
import { Struct } from '$lib/services/struct';
import { type StructDataVersion, type StructData } from '$lib/services/struct';
import { sse } from '../services/sse';
import { browser } from '$app/environment';
import { attempt, attemptAsync, resolveAll } from 'ts-utils/check';
import { z } from 'zod';
import { Account } from './account';
import { Trace } from 'tatorscout/trace';
import { $Math } from 'ts-utils/math';
import type { TBAMatch } from '$lib/utils/tba';
import { teamsFromMatch } from 'tatorscout/tba';
import { match } from 'ts-utils/match';
import { Batch } from 'ts-utils/batch';
import { WritableArray, WritableBase } from '$lib/services/writables';
import YearInfo2025 from 'tatorscout/years/2025.js';
import * as remote from '$lib/remotes/scouting.remote';

export namespace Scouting {
	export const MatchScouting = new Struct({
		name: 'match_scouting',
		structure: {
			/** Event key the match belongs to. */
			eventKey: 'string',
			/** Match number within the event. */
			matchNumber: 'number',
			/** Competition level (pr, qm, qf, sf, f). */
			compLevel: 'string',
			// matchId: 'string',
			/** Team number being scouted. */
			team: 'number',
			/** Scout account id. */
			scoutId: 'string',
			/** Scout group number. */
			scoutGroup: 'number',
			/** True if this is a pre-scouting record. */
			prescouting: 'boolean',
			/** True if the match was uploaded remotely. */
			remote: 'boolean',
			/** Serialized trace payload. */
			trace: 'string',
			/** Serialized checks list. */
			checks: 'string',
			/** Scout username for display. */
			scoutUsername: 'string',
			/** Alliance color for the team. */
			alliance: 'string',
			/** Competition year. */
			year: 'number',
			/** Serialized sliders payload. */
			sliders: 'string'
		},
		socket: sse,
		browser
	});

	export type MatchScoutingData = StructData<typeof MatchScouting.data.structure>;
	export type MatchScoutingArr = DataArr<typeof MatchScouting.data.structure>;
	export type MatchScoutingHistory = StructDataVersion<typeof MatchScouting.data.structure>;

	/**
	 * Wrapper that pairs a scouting record with its parsed trace.
	 */
	export class MatchScoutingExtended extends WritableBase<{
		trace: Trace;
		scouting: MatchScoutingData;
	}> {
		static from(scouting: MatchScoutingData) {
			return attempt(() => {
				const trace = Trace.parse(scouting.data.trace).unwrap();
				return new MatchScoutingExtended(scouting, trace);
			});
		}

		constructor(scouting: MatchScoutingData, trace: Trace) {
			super({
				scouting,
				trace
			});

			// pipe all events into this class
			this.onAllUnsubscribe(scouting.subscribe(() => this.inform()));
		}

		get team() {
			return Number(this.data.scouting.data.team);
		}

		get matchNumber() {
			return Number(this.data.scouting.data.matchNumber);
		}

		get compLevel() {
			return this.data.scouting.data.compLevel;
		}

		get trace() {
			return this.data.trace;
		}

		get scouting() {
			return this.data.scouting;
		}

		get year() {
			return Number(this.data.scouting.data.year);
		}

		get eventKey() {
			return this.data.scouting.data.eventKey;
		}

		get averageVelocity() {
			return this.data.trace.averageVelocity();
		}

		get secondsNotMoving() {
			return this.data.trace.secondsNotMoving();
		}

		get id() {
			return String(this.data.scouting.data.id);
		}

		getChecks() {
			return attempt(() => {
				return z.array(z.string()).parse(JSON.parse(this.data.scouting.data.checks || '[]'));
			});
		}

		getSliders() {
			return attempt(() => {
				return z
					.record(
						z.string(),
						z.object({
							value: z.number(),
							text: z.string(),
							color: z.string().default('#000000')
						})
					)
					.parse(JSON.parse(this.data.scouting.data.sliders || '{}'));
			});
		}
	}

	/**
	 * Writable array wrapper for extended scouting records.
	 */
	export class MatchScoutingExtendedArr extends WritableArray<MatchScoutingExtended> {
		static fromArr(arr: MatchScoutingArr) {
			return attempt(() => {
				const ms = arr.data.map((scouting) => MatchScoutingExtended.from(scouting).unwrap());
				const extendedArr = new MatchScoutingExtendedArr(ms);
				extendedArr.onAllUnsubscribe(arr.subscribe(() => extendedArr.inform()));
				return extendedArr;
			});
		}

		constructor(arr: MatchScoutingExtended[]) {
			super(arr);
		}

		clone() {
			return new MatchScoutingExtendedArr([...this.data]);
		}
	}

	/**
	 * Compute the average velocity across a set of scouting traces.
	 *
	 * @returns {number} Average velocity.
	 */
	export const getAverageVelocity = (data: MatchScoutingExtended[]) => {
		return $Math.average(data.map((d) => d.data.trace.averageVelocity()));
	};

	/**
	 * Fetch archived matches for a team at an event.
	 *
	 * @returns {ReturnType<typeof MatchScoutingExtendedArr.fromArr>} Archived matches wrapper.
	 */
	export const getArchivedMatches = (team: number, eventKey: string) => {
		const res = MatchScouting.get(
			{
				team,
				eventKey,
				archived: true
			},
			{
				type: 'all'
			}
		);
		return MatchScoutingExtendedArr.fromArr(res);
	};

	/**
	 * Compute average auto score for the provided year.
	 *
	 * @returns {ReturnType<typeof attempt>} Result wrapper for the average.
	 */
	export const averageAutoScore = (data: MatchScoutingExtended[], year: number) => {
		return attempt(() => {
			if (year === 2025) {
				return $Math.average(data.map((d) => YearInfo2025.parse(d.data.trace).auto.total));
			}
			return 0;
		});
	};

	/**
	 * Compute average teleop score for the provided year.
	 *
	 * @returns {ReturnType<typeof attempt>} Result wrapper for the average.
	 */
	export const averageTeleopScore = (data: MatchScoutingExtended[], year: number) => {
		return attempt(() => {
			if (year === 2025) {
				return $Math.average(data.map((d) => YearInfo2025.parse(d.data.trace).teleop.total));
			}
			return 0;
		});
	};

	/**
	 * Compute average endgame points for a team using TBA match breakdowns.
	 *
	 * @returns {ReturnType<typeof attempt>} Result wrapper for the average.
	 */
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

	/**
	 * Compute average action contributions across a set of scouting traces.
	 *
	 * @returns {Contribution} Average contribution totals.
	 */
	export const averageContributions = (data: MatchScoutingExtended[]): Contribution => {
		return attempt(() => {
			const coralCounts = data.map((d) => {
				const actionObj = d.data.trace.points.reduce(
					(acc, curr) => {
						if (!curr[3]) return acc;
						if (['cl1', 'cl2', 'cl3', 'cl4', 'brg', 'prc', 'shc', 'dpc', 'prk'].includes(curr[3])) {
							acc[curr[3]] = (acc[curr[3]] || 0) + 1;
						}
						return acc;
					},
					{} as Record<string, number>
				);

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

	/**
	 * Compute average seconds not moving across scouting traces.
	 *
	 * @returns {ReturnType<typeof attempt>} Result wrapper for the average.
	 */
	export const averageSecondsNotMoving = (data: MatchScoutingExtended[]) => {
		return attempt(() => {
			return $Math.average(data.map((d) => d.data.trace.secondsNotMoving()));
		});
	};

	/**
	 * Fetch all scouting entries for a team at an event.
	 *
	 * @returns {ReturnType<typeof MatchScouting.get>} Struct query result.
	 */
	export const scoutingFromTeam = (team: number, eventKey: string) => {
		return MatchScouting.get(
			{
				team,
				eventKey
			},
			{
				type: 'all'
			}
		);
	};

	/**
	 * Fetch archived prescouting entries for a team at an event.
	 *
	 * @returns {ReturnType<typeof MatchScouting.get>} Struct query result.
	 */
	export const preScouting = (team: number, eventKey: string) => {
		return MatchScouting.get(
			{
				team,
				eventKey,
				prescouting: true,
				archived: true
			},
			{
				type: 'all'
			}
		);
	};

	/**
	 * Toggle archive state for practice matches at an event.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the command.
	 */
	export const setPracticeArchive = (eventKey: string, archive: boolean) => {
		return attemptAsync(async () => {
			return remote.setPracticeArchive({ eventKey, archive });
		});
	};

	export const TeamComments = new Struct({
		name: 'team_comments',
		structure: {
			/** Match scouting id associated with the comment. */
			matchScoutingId: 'string',
			/** Account id of the commenter. */
			accountId: 'string',
			/** Team number the comment references. */
			team: 'number',
			/** Comment text content. */
			comment: 'string',
			/** Comment type/category. */
			type: 'string',
			/** Event key associated with the comment. */
			eventKey: 'string',
			/** Scout username for display. */
			scoutUsername: 'string'
		},
		socket: sse,
		browser
	});

	export type TeamCommentsData = StructData<typeof TeamComments.data.structure>;
	export type TeamCommentsArr = DataArr<typeof TeamComments.data.structure>;

	export const MatchSchema = z.object({
		trace: z.unknown(),
		eventKey: z.string(),
		match: z.number().int(),
		team: z.number().int(),
		compLevel: z.enum(['pr', 'qm', 'qf', 'sf', 'f']),
		flipX: z.boolean(),
		flipY: z.boolean(),
		checks: z.array(z.string()),
		comments: z.record(z.string()),
		scout: z.string(),
		prescouting: z.boolean(),
		practice: z.boolean(),
		alliance: z.union([z.literal('red'), z.literal('blue'), z.literal(null)]),
		group: z.number().int(),
		sliders: z.record(
			z.string(),
			z.object({
				value: z.number().int().min(0).max(5),
				text: z.string(),
				color: z.string()
			})
		)
	});
	export type MatchSchemaType = z.infer<typeof MatchSchema>;

	const batcher = new Batch(
		async (matches: MatchSchemaType[]) => {
			const res = await fetch('/event-server/submit-match/batch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(
					matches.map((m) => ({
						...m,
						remote: true
					}))
				)
			});

			if (!res.ok) {
				return matches.map(() => ({
					success: false,
					message: 'Failed to upload match batch'
				}));
			}

			const json = await res.json();
			return z
				.array(
					z.object({
						success: z.boolean(),
						message: z.string().optional()
					})
				)
				.parse(json);
		},
		{
			batchSize: 10,
			interval: 500,
			limit: 500,
			timeout: 10000
		}
	);

	batcher.on('drained', () => console.log('Match upload batcher drained'));

	/**
	 * Upload a batch of match scouting payloads.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the upload.
	 */
	export const uploadMatches = (matches: MatchSchemaType[]) => {
		return attemptAsync(async () => {
			return resolveAll(await Promise.all(matches.map(async (m) => batcher.add(m, true)))).unwrap();
		});
	};

	export namespace PIT {
		export const Sections = new Struct({
			name: 'pit_sections',
			structure: {
				/** Section display name. */
				name: 'string',
				/** Sort order within the event. */
				order: 'number',
				/** Event key this section belongs to. */
				eventKey: 'string'
			},
			socket: sse,
			browser
		});

		export type SectionData = StructData<typeof Sections.data.structure>;
		export type SectionArr = DataArr<typeof Sections.data.structure>;

		export const Groups = new Struct({
			name: 'pit_groups',
			structure: {
				/** Parent section id. */
				sectionId: 'string',
				/** Group display name. */
				name: 'string',
				/** Sort order within the section. */
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
				/** Parent group id. */
				groupId: 'string',
				/** Question prompt text. */
				question: 'string',
				/** Question description text. */
				description: 'string',
				/** Question type (text, number, select, etc). */
				type: 'string',
				/** Question key identifier. */
				key: 'string',
				/** Sort order within the group. */
				order: 'number',
				/** Serialized options list for select-like types. */
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
				/** Question id being answered. */
				questionId: 'string',
				/** Serialized answer array. */
				answer: 'string',
				/** Team number this answer applies to. */
				team: 'number',
				/** Account id of the respondent. */
				accountId: 'string'
			},
			socket: sse,
			browser
		});

		export type AnswerData = StructData<typeof Answers.data.structure>;
		export type AnswerArr = DataArr<typeof Answers.data.structure>;

		export type Options = {};

		/**
		 * Parse the JSON options list for a pit question.
		 *
		 * @returns {ReturnType<typeof attempt>} Result wrapper for the parsed options.
		 */
		export const parseOptions = (question: QuestionData) => {
			return attempt(() => {
				const options = question.data.options;
				if (!options) throw new Error('No options key');
				return z.array(z.string()).parse(JSON.parse(options));
			});
		};

		/**
		 * Parse the JSON answer list for a pit question.
		 *
		 * @returns {ReturnType<typeof attempt>} Result wrapper for the parsed answer.
		 */
		export const parseAnswer = (answer: AnswerData) => {
			return attempt(() => {
				const value = answer.data.answer;
				if (!value) throw new Error('No answer key');
				return z.array(z.string()).parse(JSON.parse(value));
			});
		};

		/**
		 * Fetch answers for a group and filter by question ids.
		 *
		 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the answers.
		 */
		export const getAnswersFromGroup = (group: GroupData, questionIDs: string[]) => {
			return attemptAsync(async () => {
				return remote.pitAnswersFromGroup({
					questions: questionIDs,
					group: String(group.data.id)
				});
			});
		};

		/**
		 * Copy pit-scouting template data between events.
		 *
		 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the copy.
		 */
		export const copyFromEvent = (from: string, to: string) => {
			return attemptAsync(async () => {
				return remote.copyPitScoutingFromEvent({
					from,
					to
				});
			});
		};

		/**
		 * Generate a new pit-scouting template for an event.
		 *
		 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the generation.
		 */
		export const generateEventTemplate = (eventKey: string) => {
			return attemptAsync(async () => {
				return remote.generateEventPitscoutingTemplate({ eventKey });
			});
		};

		/**
		 * Submit a pit-scouting answer for a question.
		 *
		 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the submission.
		 */
		export const answerQuestion = (
			question: QuestionData,
			answer: string[],
			team: number,
			account: Account.AccountData
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
						accountId
					})
				).unwrap();

				if (!res.success) throw new Error(res.message || 'Failed to answer question');
			});
		};
	}
}
