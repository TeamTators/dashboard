/**
 * @fileoverview Scouting Struct models, helpers, and match upload utilities.
 *
 * @description
 * Provides client-side Structs for match scouting, team comments, and pit scouting, plus
 * helper classes and functions for analyzing scouting data and uploading match batches.
 */
import { DataArr } from '$lib/services/struct/data-arr';
import { Struct } from '$lib/services/struct';
import { type StructDataVersion, type StructData } from '$lib/services/struct';
import { sse } from '../services/sse';
import { browser } from '$app/environment';
import { attempt, attemptAsync, resolveAll, type Result } from 'ts-utils/check';
import { z } from 'zod';
import { Account } from './account';
import { Trace } from 'tatorscout/trace';
// import { $Math } from 'ts-utils/math';
// import type { TBAMatch } from '$lib/utils/tba';
// import { teamsFromMatch } from 'tatorscout/tba';
// import { match } from 'ts-utils/match';
import { Batch } from 'ts-utils/batch';
import { WritableArray, WritableBase } from '$lib/services/writables';
import YearInfo2024 from 'tatorscout/years/2024.js';
import YearInfo2025 from 'tatorscout/years/2025.js';
import YearInfo2026 from 'tatorscout/years/2026.js';
import * as remote from '$lib/remotes/scouting.remote';
import type { ParsedBreakdown } from 'tatorscout/years';
import type { TBAEvent } from '$lib/utils/tba';

/**
 * Client-side scouting models, helpers, and batch utilities.
 *
 * @example
 * const res = Scouting.MatchScouting.get({ eventKey: '2025miket', team: 33 }, { type: 'all' });
 * const extended = Scouting.MatchScoutingExtendedArr.fromArr(res).unwrap();
 * const avg = Scouting.getAverageVelocity(extended.data);
 */
export namespace Scouting {
	/**
	 * Client Struct for match scouting entries.
	 *
	 * @example
	 * const res = Scouting.MatchScouting.get({ eventKey: '2025miket' }, { type: 'all' });
	 * const first = res.data[0];
	 */
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

	/**
	 * Type for a match scouting record.
	 *
	 * @example
	 * const record: Scouting.MatchScoutingData = res.data[0];
	 */
	export type MatchScoutingData = StructData<typeof MatchScouting.data.structure>;
	/**
	 * Type for an array of match scouting records.
	 *
	 * @example
	 * const arr: Scouting.MatchScoutingArr = res;
	 */
	export type MatchScoutingArr = DataArr<typeof MatchScouting.data.structure>;
	/**
	 * Type for versioned match scouting data.
	 *
	 * @example
	 * const history: Scouting.MatchScoutingHistory = record.history;
	 */
	export type MatchScoutingHistory = StructDataVersion<typeof MatchScouting.data.structure>;

	/**
	 * Wrapper that pairs a scouting record with its parsed trace.
	 *
	 * @example
	 * const ext = Scouting.MatchScoutingExtended.from(record).unwrap();
	 * console.log(ext.averageVelocity);
	 */
	export class MatchScoutingExtended extends WritableBase<{
		trace: Trace;
		scouting: MatchScoutingData;
	}> {
		private static readonly cache = new Map<string, MatchScoutingExtended>();

		/**
		 * Create or fetch a cached extended wrapper for a record.
		 *
		 * @param scouting - Match scouting record to extend.
		 * @returns Attempt-wrapped extended record.
		 *
		 * @example
		 * const ext = Scouting.MatchScoutingExtended.from(record).unwrap();
		 */
		static from(scouting: MatchScoutingData) {
			return attempt(() => {
				const has = this.cache.get(String(scouting.data.id));
				if (has) return has;
				const trace = Trace.parse(scouting.data.trace).unwrap();
				const ms = new MatchScoutingExtended(scouting, trace);
				this.cache.set(String(scouting.data.id), ms);
				return ms;
			});
		}

		/**
		 * Build an extended wrapper around a record and parsed trace.
		 *
		 * @param scouting - Match scouting record to wrap.
		 * @param trace - Parsed trace instance.
		 *
		 * @example
		 * const trace = Trace.parse(record.data.trace).unwrap();
		 * const ext = new Scouting.MatchScoutingExtended(record, trace);
		 */
		constructor(scouting: MatchScoutingData, trace: Trace) {
			super({
				scouting,
				trace
			});

			// pipe all events into this class
			this.onAllUnsubscribe(scouting.subscribe(() => this.inform()));
		}

		/**
		 * Team number for this record.
		 *
		 * @example
		 * const team = ext.team;
		 */
		get team() {
			return Number(this.data.scouting.data.team);
		}

		/**
		 * Match number within the event.
		 *
		 * @example
		 * const matchNumber = ext.matchNumber;
		 */
		get matchNumber() {
			return Number(this.data.scouting.data.matchNumber);
		}

		/**
		 * Competition level (pr, qm, qf, sf, f).
		 *
		 * @example
		 * const level = ext.compLevel;
		 */
		get compLevel() {
			return this.data.scouting.data.compLevel;
		}

		/**
		 * Parsed trace instance.
		 *
		 * @example
		 * const trace = ext.trace;
		 */
		get trace() {
			return this.data.trace;
		}

		/**
		 * Raw match scouting record.
		 *
		 * @example
		 * const raw = ext.scouting;
		 */
		get scouting() {
			return this.data.scouting;
		}

		/**
		 * Competition year.
		 *
		 * @example
		 * const year = ext.year;
		 */
		get year() {
			return Number(this.data.scouting.data.year);
		}

		/**
		 * Event key for the match.
		 *
		 * @example
		 * const eventKey = ext.eventKey;
		 */
		get eventKey() {
			return this.data.scouting.data.eventKey;
		}

		/**
		 * Average velocity computed from the trace.
		 *
		 * @example
		 * const avg = ext.averageVelocity;
		 */
		get averageVelocity() {
			return this.data.trace.averageVelocity();
		}

		/**
		 * Seconds not moving computed from the trace.
		 *
		 * @example
		 * const idleSeconds = ext.secondsNotMoving;
		 */
		get secondsNotMoving() {
			return this.data.trace.secondsNotMoving();
		}

		/**
		 * Record id as a string.
		 *
		 * @example
		 * const id = ext.id;
		 */
		get id() {
			return String(this.data.scouting.data.id);
		}

		/**
		 * Parse the checks array from the record.
		 *
		 * @param reactive - When true, returns a derived writable; otherwise returns a plain array.
		 * @returns Checks as a plain array or reactive writable.
		 *
		 * @example
		 * const checks = ext.getChecks(false);
		 *
		 * @example
		 * const checksStore = ext.getChecks(true);
		 * checksStore.subscribe((value) => console.log(value));
		 */
		getChecks(reactive: false): Result<string[]>;
		getChecks(reactive: true): WritableBase<string[]>;
		getChecks(reactive: boolean): Result<string[]> | WritableBase<string[]> {
			if (reactive) {
				return this.derive((data) => {
					const res = z.array(z.string()).safeParse(JSON.parse(data.scouting.data.checks || '[]'));
					if (res.success) {
						return res.data;
					} else {
						console.error('Failed to parse checks:', res.error);
						return [];
					}
				});
			} else {
				return attempt(() => {
					const res = z
						.array(z.string())
						.safeParse(JSON.parse(this.data.scouting.data.checks || '[]'));
					if (res.success) {
						return res.data;
					} else {
						console.error('Failed to parse checks:', res.error);
						return [];
					}
				});
			}
		}

		/**
		 * Parse the sliders map from the record.
		 *
		 * @param reactive - When true, returns a derived writable; otherwise returns a plain object.
		 * @returns Sliders map as a plain object or reactive writable.
		 *
		 * @example
		 * const sliders = ext.getSliders(false);
		 * const defense = sliders.defense?.value ?? 0;
		 *
		 * @example
		 * const slidersStore = ext.getSliders(true);
		 * slidersStore.subscribe((value) => console.log(value));
		 */
		getSliders(
			reactive: false
		): Result<Record<string, { value: number; text: string; color: string }>>;
		getSliders(
			reactive: true
		): WritableBase<Record<string, { value: number; text: string; color: string }>>;
		getSliders(
			reactive: boolean
		):
			| Result<Record<string, { value: number; text: string; color: string }>>
			| WritableBase<Record<string, { value: number; text: string; color: string }>> {
			if (reactive) {
				return this.derive((data) => {
					const res = z
						.record(
							z.string(),
							z.object({
								value: z.number(),
								text: z.string(),
								color: z.string().default('#000000')
							})
						)
						.safeParse(JSON.parse(data.scouting.data.sliders || '{}'));
					if (res.success) {
						return res.data;
					} else {
						console.error('Failed to parse sliders:', res.error);
						return {};
					}
				});
			} else {
				return attempt(() => {
					const res = z
						.record(
							z.string(),
							z.object({
								value: z.number(),
								text: z.string(),
								color: z.string().default('#000000')
							})
						)
						.safeParse(JSON.parse(this.data.scouting.data.sliders || '{}'));
					if (res.success) {
						return res.data;
					} else {
						console.error('Failed to parse sliders:', res.error);
						return {};
					}
				});
			}
		}

		/**
		 * Count action contributions from trace points.
		 *
		 * @param reactive - When true, returns a derived writable; otherwise returns a plain object.
		 * @returns Contribution map as a plain object or reactive writable.
		 *
		 * @example
		 * const contrib = ext.getContribution(false);
		 * const score = contrib.Score ?? 0;
		 *
		 * @example
		 * const contribStore = ext.getContribution(true);
		 * contribStore.subscribe((value) => console.log(value));
		 */
		getContribution(
			year: number,
			reactive: false,
			actionLabels?: boolean
		): Result<Record<string, number>>;
		getContribution(
			year: number,
			reactive: true,
			actionLabels?: boolean
		): WritableBase<Record<string, number>>;
		getContribution(
			year: number,
			reactive: boolean,
			actionLabels = true
		): Result<Record<string, number>> | WritableBase<Record<string, number>> {
			const get = (data: { scouting: MatchScoutingData; trace: Trace }) => {
				const info = getYearInfo(year);
				if (info.isErr()) return {};

				const contrib: Record<string, number> = {};

				for (const key of Object.keys(info.value.actions)) {
					contrib[key] = 0;
				}

				for (const [, , , a] of data.trace.points) {
					if (a) {
						contrib[a] = (contrib[a] || 0) + 1;
					}
				}
				if (!actionLabels) return contrib;
				const labels: Record<string, number> = {};
				for (const [key, label] of Object.entries(info.value.actions)) {
					labels[label] = contrib[key];
				}
				return labels;
			};
			if (reactive) {
				return this.derive(get);
			} else {
				return attempt(() => {
					return get(this.data);
				});
			}
		}
	}

	/**
	 * Writable array wrapper for extended scouting records.
	 *
	 * @example
	 * const extArr = Scouting.MatchScoutingExtendedArr.fromArr(res).unwrap();
	 * const summary = extArr.checksSummary(false);
	 */
	export class MatchScoutingExtendedArr extends WritableArray<MatchScoutingExtended> {
		/**
		 * Convert a Struct array or plain array into an extended array wrapper.
		 *
		 * @param arr - Struct array or raw array of records.
		 * @returns Attempt-wrapped extended array.
		 *
		 * @example
		 * const extArr = Scouting.MatchScoutingExtendedArr.fromArr(res).unwrap();
		 */
		static fromArr(arr: MatchScoutingArr | MatchScoutingData[], team: number) {
			return attempt(() => {
				const data = arr instanceof DataArr ? arr.data : arr;
				const ms = data.map((scouting) => MatchScoutingExtended.from(scouting).unwrap());
				const extendedArr = new MatchScoutingExtendedArr(ms, team);
				const compLevels = ['pr', 'qm', 'qf', 'sf', 'f'];
				extendedArr.sort((a, b) => {
					if (a.compLevel === b.compLevel) {
						return a.matchNumber - b.matchNumber;
					}
					return compLevels.indexOf(String(a.compLevel)) - compLevels.indexOf(String(b.compLevel));
				});
				if (arr instanceof DataArr) {
					extendedArr.pipeData(arr, (data) => {
						return data.map((scouting) => MatchScoutingExtended.from(scouting).unwrap());
					});
				}
				return extendedArr;
			});
		}

		/**
		 * Create a writable array wrapper.
		 *
		 * @param arr - Extended scouting records.
		 *
		 * @example
		 * const extArr = new Scouting.MatchScoutingExtendedArr([ext], 33);
		 */
		constructor(
			arr: MatchScoutingExtended[],
			public readonly team: number
		) {
			super(arr);
		}

		/**
		 * Shallow clone the array wrapper.
		 *
		 * @returns New wrapper with the same items.
		 *
		 * @example
		 * const copy = extArr.clone();
		 */
		clone() {
			return new MatchScoutingExtendedArr([...this.data], this.team);
		}

		/**
		 * Summarize checks across all records.
		 *
		 * @param reactive - When true, returns a derived writable; otherwise returns a plain object.
		 * @returns Check counts as a plain object or reactive writable.
		 *
		 * @example
		 * const summary = extArr.checksSummary(false);
		 * const intakeCount = summary.Intake ?? 0;
		 *
		 * @example
		 * const summaryStore = extArr.checksSummary(true);
		 * summaryStore.subscribe((value) => console.log(value));
		 */
		checksSummary(reactive: false): Result<Record<string, number>>;
		checksSummary(reactive: true): WritableBase<Record<string, number>>;
		checksSummary(reactive: boolean) {
			if (reactive) {
				return this.derive((data) => {
					const result: Record<string, number> = {};
					for (const ms of data) {
						const checks = ms.getChecks(false);
						if (checks.isErr()) {
							console.error('Failed to get checks for record', ms.id, checks.error);
							continue;
						}
						for (const check of checks.value) {
							result[check] = (result[check] || 0) + 1;
						}
					}
					return result;
				});
			} else {
				return attempt(() => {
					const result: Record<string, number> = {};
					for (const ms of this.data) {
						const checks = ms.getChecks(false).unwrap();
						for (const check of checks) {
							result[check] = (result[check] || 0) + 1;
						}
					}
					return result;
				});
			}
		}

		/**
		 * Compute average or max action contributions across a set of scouting traces.
		 *
		 * @param year - Competition year to use for action mapping.
		 * @param reactive - If true, returns a derived writable; otherwise returns a plain object.
		 * @param type - Aggregation type: 'average' or 'max'.
		 * @returns Contribution map as a plain object or reactive writable.
		 *
		 * @example
		 * const avg = extArr.contribution(2025, false, 'average').unwrap();
		 * const max = extArr.contribution(2025, false, 'max').unwrap();
		 * const avgStore = extArr.contribution(2025, true, 'average');
		 * avgStore.subscribe((value) => console.log(value));
		 */
		contribution(
			year: number,
			reactive: false,
			type: 'average' | 'max'
		): Result<Record<string, number>>;
		contribution(
			year: number,
			reactive: true,
			type: 'average' | 'max'
		): WritableBase<Record<string, number>>;
		contribution(year: number, reactive: boolean, type: 'average' | 'max') {
			const get = (data: MatchScoutingExtended[]) => {
				const totals: Record<string, number[]> = {};
				for (const ms of data) {
					const contrib = ms.getContribution(year, false);
					if (contrib.isErr()) continue;
					Object.entries(contrib.value).forEach(([key, value]) => {
						if (!totals[key]) {
							totals[key] = [];
						}
						totals[key].push(value);
					});
				}

				const result: Record<string, number> = {};
				Object.entries(totals).forEach(([key, values]) => {
					if (type === 'average') {
						result[key] = values.reduce((a, b) => a + b, 0) / values.length;
					} else if (type === 'max') {
						result[key] = Math.max(...values);
					}
				});
				return result;
			};

			if (reactive) {
				return this.derive(get);
			} else {
				return attempt(() => get(this.data));
			}
		}

		breakdown(year: number, reactive: false): Result<ParsedBreakdown<string>>;
		breakdown(year: number, reactive: true): WritableBase<ParsedBreakdown<string>>;
		breakdown(year: number, reactive: boolean) {
			const get = (matches: MatchScoutingExtended[]) => {
				const info = getYearInfo(year);
				const breakdown: ParsedBreakdown<string> = {
					auto: {
						total: 0
					},
					teleop: {
						total: 0
					},
					endgame: {
						total: 0
					},
					total: 0
				};
				if (info.isErr()) {
					console.error(info.error);
					return breakdown;
				}

				for (const match of matches) {
					const { auto, teleop, endgame, total } = info.value.parse(match.trace);
					for (const [key, val] of Object.entries(auto)) {
						if (!breakdown.auto[key]) {
							breakdown.auto[key] = 0;
						}
						breakdown.auto[key] += val;
					}

					breakdown.auto.total += auto.total;

					for (const [key, val] of Object.entries(teleop)) {
						if (!breakdown.teleop[key]) {
							breakdown.teleop[key] = 0;
						}
						breakdown.teleop[key] += val;
					}

					breakdown.teleop.total += teleop.total;

					for (const [key, val] of Object.entries(endgame)) {
						if (!breakdown.endgame[key]) {
							breakdown.endgame[key] = 0;
						}
						breakdown.endgame[key] += val;
					}

					breakdown.endgame.total += endgame.total;

					breakdown.total = total;
				}
				return breakdown;
			};

			if (reactive) {
				return this.derive(get);
			} else {
				return attempt(() => {
					return get(this.data);
				});
			}
		}

		averageVelocity(reactive: false): Result<number>;
		averageVelocity(reactive: true): WritableBase<number>;
		averageVelocity(reactive: boolean): Result<number> | WritableBase<number> {
			const get = (data: MatchScoutingExtended[]): number => {
				return (
					data.reduce((cur, acc) => {
						return cur + acc.averageVelocity;
					}, 0) / data.length
				);
			};

			if (reactive) return this.derive(get);
			else return attempt(() => get(this.data));
		}

		averageSecondsNotMoving(reactive: false): Result<number>;
		averageSecondsNotMoving(reactive: true): WritableBase<number>;
		averageSecondsNotMoving(reactive: boolean): Result<number> | WritableBase<number> {
			const get = (data: MatchScoutingExtended[]): number => {
				return (
					data.reduce((cur, acc) => {
						return cur + acc.secondsNotMoving;
					}, 0) / data.length
				);
			};

			if (reactive) return this.derive(get);
			else return attempt(() => get(this.data));
		}

		getTeam(event: TBAEvent, force: boolean, expires: Date) {
			return attemptAsync(async () => {
				const teams = await event.getTeams(force, expires).unwrap();
				return teams.find((t) => t.tba.team_number === this.team);
			});
		}
	}

	/**
	 * Compute the average velocity across a set of scouting traces.
	 *
	 * @param data - Extended scouting records.
	 * @returns {number} Average velocity.
	 *
	 * @example
	 * const avg = Scouting.getAverageVelocity(extArr.data);
	 */
	// export const getAverageVelocity = (data: MatchScoutingExtended[]) => {
	// 	return $Math.average(data.map((d) => d.data.trace.averageVelocity()));
	// };

	/**
	 * Fetch archived matches for a team at an event.
	 *
	 * @param team - Team number to filter by.
	 * @param eventKey - Event key to filter by.
	 * @returns {ReturnType<typeof MatchScoutingExtendedArr.fromArr>} Archived matches wrapper.
	 *
	 * @example
	 * const archived = Scouting.getArchivedMatches(33, '2025miket').unwrap();
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
		return MatchScoutingExtendedArr.fromArr(res, team);
	};

	/**
	 * Compute average auto score for the provided year.
	 *
	 * @param data - Extended scouting records.
	 * @param year - Competition year.
	 * @returns {ReturnType<typeof attempt>} Result wrapper for the average.
	 *
	 * @example
	 * const avg = Scouting.averageAutoScore(extArr.data, 2025).unwrap();
	 */
	// export const averageAutoScore = (data: MatchScoutingExtended[], year: number) => {
	// 	return attempt(() => {
	// 		if (year === 2025) {
	// 			return $Math.average(data.map((d) => YearInfo2025.parse(d.data.trace).auto.total));
	// 		}
	// 		return 0;
	// 	});
	// };

	/**
	 * Compute average teleop score for the provided year.
	 *
	 * @param data - Extended scouting records.
	 * @param year - Competition year.
	 * @returns {ReturnType<typeof attempt>} Result wrapper for the average.
	 *
	 * @example
	 * const avg = Scouting.averageTeleopScore(extArr.data, 2025).unwrap();
	 */
	// export const averageTeleopScore = (data: MatchScoutingExtended[], year: number) => {
	// 	return attempt(() => {
	// 		if (year === 2025) {
	// 			return $Math.average(data.map((d) => YearInfo2025.parse(d.data.trace).teleop.total));
	// 		}
	// 		return 0;
	// 	});
	// };

	/**
	 * Compute average endgame points for a team using TBA match breakdowns.
	 *
	 * @param matches - TBA matches to inspect.
	 * @param team - Team number to average.
	 * @param year - Competition year.
	 * @returns {ReturnType<typeof attempt>} Result wrapper for the average.
	 *
	 * @example
	 * const avg = Scouting.averageEndgameScore(matches, 33, 2025).unwrap();
	 */
	// export const averageEndgameScore = (matches: TBAMatch[], team: number, year: number) => {
	// 	return attempt(() => {
	// 		if (year === 2025) {
	// 			const endgames = matches
	// 				.filter((m) => teamsFromMatch(m.tba).includes(team))
	// 				.map((m) => {
	// 					const match2025 = m.asYear(2025).unwrap();
	// 					const redPosition = match2025.alliances.red.team_keys.indexOf(`frc${team}`);
	// 					const bluePosition = match2025.alliances.blue.team_keys.indexOf(`frc${team}`);
	// 					const alliance = redPosition !== -1 ? 'red' : bluePosition !== -1 ? 'blue' : null;
	// 					const position =
	// 						alliance === 'red' ? redPosition : alliance === 'blue' ? bluePosition : -1;
	// 					if (alliance) {
	// 						const endgameRobots = [
	// 							match2025.score_breakdown[alliance].endGameRobot1, // Parked, DeepClimb, ShallowClimb
	// 							match2025.score_breakdown[alliance].endGameRobot2,
	// 							match2025.score_breakdown[alliance].endGameRobot3
	// 						];

	// 						return match<string, number>(endgameRobots[position])
	// 							.case('Parked', () => 2)
	// 							.case('ShallowCage', () => 6)
	// 							.case('DeepCage', () => 12)
	// 							.default(() => 0)
	// 							.exec()
	// 							.unwrap();
	// 					}

	// 					return 0;
	// 				});

	// 			return $Math.average(endgames);
	// 		}

	// 		return 0;
	// 	});
	// };

	/**
	 * Map of action names to contribution totals.
	 *
	 * @example
	 * const contrib: Scouting.Contribution = { Score: 12, Defend: 3 };
	 */
	export type Contribution = Record<string, number>;

	/**
	 * Compute average action contributions across a set of scouting traces.
	 *
	 * @param data - Extended scouting records.
	 * @returns {Contribution} Average contribution totals.
	 *
	 * @example
	 * const avg = Scouting.averageContributions(extArr.data).unwrap();
	 */
	// export const averageContributions = (data: MatchScoutingExtended[]) => {
	// 	return attempt<Contribution>(() => {
	// 		const coralCounts = data.map((d) => {
	// 			const actionObj = d.data.trace.points.reduce(
	// 				(acc, curr) => {
	// 					if (!curr[3]) return acc;
	// 					acc[curr[3]] = (acc[curr[3]] || 0) + 1;
	// 					return acc;
	// 				},
	// 				{} as Record<string, number>
	// 			);

	// 			return actionObj;
	// 		});

	// 		const totalActions = coralCounts.reduce(
	// 			(acc, curr) => {
	// 				Object.entries(curr).forEach(([key, value]) => {
	// 					acc[key] = (acc[key] || 0) + value;
	// 				});
	// 				return acc;
	// 			},
	// 			{} as Record<string, number>
	// 		);

	// 		const count = coralCounts.length;
	// 		return Object.fromEntries(
	// 			Object.entries(totalActions).map(([key, value]) => [key, value / count])
	// 		);
	// 	});
	// };

	/**
	 * Compute average seconds not moving across scouting traces.
	 *
	 * @param data - Extended scouting records.
	 * @returns {ReturnType<typeof attempt>} Result wrapper for the average.
	 *
	 * @example
	 * const avg = Scouting.averageSecondsNotMoving(extArr.data).unwrap();
	 */
	// export const averageSecondsNotMoving = (data: MatchScoutingExtended[]) => {
	// 	return attempt(() => {
	// 		return $Math.average(data.map((d) => d.data.trace.secondsNotMoving()));
	// 	});
	// };

	/**
	 * Fetch all scouting entries for a team at an event.
	 *
	 * @param team - Team number to filter by.
	 * @param eventKey - Event key to filter by.
	 * @returns {ReturnType<typeof MatchScouting.get>} Struct query result.
	 *
	 * @example
	 * const res = Scouting.scoutingFromTeam(33, '2025miket');
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
	 * @param team - Team number to filter by.
	 * @param eventKey - Event key to filter by.
	 * @returns {ReturnType<typeof MatchScouting.get>} Struct query result.
	 *
	 * @example
	 * const res = Scouting.preScouting(33, '2025miket');
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
	 * @param eventKey - Event key to update.
	 * @param archive - Whether to archive practice matches.
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the command.
	 *
	 * @example
	 * await Scouting.setPracticeArchive('2025miket', true).unwrap();
	 */
	export const setPracticeArchive = (eventKey: string, archive: boolean) => {
		return attemptAsync(async () => {
			return remote.setPracticeArchive({ eventKey, archive });
		});
	};

	/**
	 * Client Struct for team comments.
	 *
	 * @example
	 * const res = Scouting.TeamComments.get({ team: 33 }, { type: 'all' });
	 */
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

	/**
	 * Type for a team comment record.
	 *
	 * @example
	 * const comment: Scouting.TeamCommentsData = res.data[0];
	 */
	export type TeamCommentsData = StructData<typeof TeamComments.data.structure>;
	/**
	 * Type for an array of team comment records.
	 *
	 * @example
	 * const arr: Scouting.TeamCommentsArr = res;
	 */
	export type TeamCommentsArr = DataArr<typeof TeamComments.data.structure>;

	/**
	 * Schema for match scouting upload payloads.
	 *
	 * @example
	 * const parsed = Scouting.MatchSchema.parse(payload);
	 */
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

	/**
	 * Batch uploader for match scouting payloads.
	 *
	 * @example
	 * // Matches are queued by Scouting.uploadMatches.
	 */
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
	 * @param matches - Match payloads to enqueue and upload.
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the upload.
	 *
	 * @example
	 * const res = await Scouting.uploadMatches([payload]).unwrap();
	 */
	export const uploadMatches = (matches: MatchSchemaType[]) => {
		return attemptAsync(async () => {
			return resolveAll(await Promise.all(matches.map(async (m) => batcher.add(m, true)))).unwrap();
		});
	};

	export namespace PIT {
		/**
		 * Client Struct for pit scouting sections.
		 *
		 * @example
		 * const res = Scouting.PIT.Sections.get({ eventKey: '2025miket' }, { type: 'all' });
		 */
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

		/**
		 * Type for a pit section record.
		 *
		 * @example
		 * const section: Scouting.PIT.SectionData = res.data[0];
		 */
		export type SectionData = StructData<typeof Sections.data.structure>;
		/**
		 * Type for an array of pit section records.
		 *
		 * @example
		 * const arr: Scouting.PIT.SectionArr = res;
		 */
		export type SectionArr = DataArr<typeof Sections.data.structure>;

		/**
		 * Client Struct for pit scouting groups.
		 *
		 * @example
		 * const res = Scouting.PIT.Groups.get({ sectionId }, { type: 'all' });
		 */
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

		/**
		 * Type for a pit group record.
		 *
		 * @example
		 * const group: Scouting.PIT.GroupData = res.data[0];
		 */
		export type GroupData = StructData<typeof Groups.data.structure>;
		/**
		 * Type for an array of pit group records.
		 *
		 * @example
		 * const arr: Scouting.PIT.GroupArr = res;
		 */
		export type GroupArr = DataArr<typeof Groups.data.structure>;

		/**
		 * Client Struct for pit scouting questions.
		 *
		 * @example
		 * const res = Scouting.PIT.Questions.get({ groupId }, { type: 'all' });
		 */
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

		/**
		 * Type for a pit question record.
		 *
		 * @example
		 * const question: Scouting.PIT.QuestionData = res.data[0];
		 */
		export type QuestionData = StructData<typeof Questions.data.structure>;
		/**
		 * Type for an array of pit question records.
		 *
		 * @example
		 * const arr: Scouting.PIT.QuestionArr = res;
		 */
		export type QuestionArr = DataArr<typeof Questions.data.structure>;

		/**
		 * Client Struct for pit scouting answers.
		 *
		 * @example
		 * const res = Scouting.PIT.Answers.get({ team: 33 }, { type: 'all' });
		 */
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

		/**
		 * Type for a pit answer record.
		 *
		 * @example
		 * const answer: Scouting.PIT.AnswerData = res.data[0];
		 */
		export type AnswerData = StructData<typeof Answers.data.structure>;
		/**
		 * Type for an array of pit answer records.
		 *
		 * @example
		 * const arr: Scouting.PIT.AnswerArr = res;
		 */
		export type AnswerArr = DataArr<typeof Answers.data.structure>;

		/**
		 * Placeholder type for pit question options.
		 *
		 * @example
		 * const options: Scouting.PIT.Options = {};
		 */
		export type Options = {};

		/**
		 * Parse the JSON options list for a pit question.
		 *
		 * @param question - Question record with an options payload.
		 * @returns {ReturnType<typeof attempt>} Result wrapper for the parsed options.
		 *
		 * @example
		 * const options = Scouting.PIT.parseOptions(question).unwrap();
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
		 * @param answer - Answer record with a serialized answer payload.
		 * @returns {ReturnType<typeof attempt>} Result wrapper for the parsed answer.
		 *
		 * @example
		 * const values = Scouting.PIT.parseAnswer(answer).unwrap();
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
		 * @param group - Pit group record to query.
		 * @param questionIDs - Question ids to include.
		 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the answers.
		 *
		 * @example
		 * const res = await Scouting.PIT.getAnswersFromGroup(group, ['q1', 'q2']).unwrap();
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
		 * @param from - Source event key.
		 * @param to - Destination event key.
		 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the copy.
		 *
		 * @example
		 * await Scouting.PIT.copyFromEvent('2024miket', '2025miket').unwrap();
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
		 * @param eventKey - Event key to generate for.
		 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the generation.
		 *
		 * @example
		 * await Scouting.PIT.generateEventTemplate('2025miket').unwrap();
		 */
		export const generateEventTemplate = (eventKey: string) => {
			return attemptAsync(async () => {
				return remote.generateEventPitscoutingTemplate({ eventKey });
			});
		};

		/**
		 * Submit a pit-scouting answer for a question.
		 *
		 * @param question - Pit question record.
		 * @param answer - Array of selected answer values.
		 * @param team - Team number this answer applies to.
		 * @param account - Account submitting the answer.
		 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the submission.
		 *
		 * @example
		 * await Scouting.PIT.answerQuestion(question, ['Yes'], 33, account).unwrap();
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

	export const getYearInfo = (year: number) => {
		return attempt(() => {
			switch (year) {
				case 2024:
					return YearInfo2024;
				case 2025:
					return YearInfo2025;
				case 2026:
					return YearInfo2026;
				default:
					throw new Error(`Unsupported year: ${year}`);
			}
		});
	};
}
