/**
 * @fileoverview Strategy Struct models and helpers.
 *
 * @description
 * Defines Structs for strategies, match whiteboards, partners, and opponents used in
 * match planning workflows.
 */
import { type DataArr } from '$lib/services/struct/data-arr';
import { Struct } from '$lib/services/struct';
import { StructData } from '$lib/services/struct';
import { sse } from '../services/sse';
import { browser } from '$app/environment';
import { WritableBase } from '$lib/services/writables';
import { Board } from '$lib/services/whiteboard';
import { attempt, attemptAsync } from 'ts-utils';
import * as remote from '$lib/remotes/strategy.remote';
import type { TBAMatch } from '$lib/utils/tba';
import { teamsFromMatch } from 'tatorscout/tba';
import { Scouting } from './scouting';

export namespace Strategy {
	// export const MatchWhiteboards = new Struct({
	// 	name: 'match_whiteboards',
	// 	structure: {
	// 		/** Event key this whiteboard belongs to. */
	// 		eventKey: 'string',
	// 		/** Match number for the whiteboard. */
	// 		matchNumber: 'number',
	// 		/** Competition level (qm, qf, sf, f). */
	// 		compLevel: 'string',
	// 		/** Serialized board data. */
	// 		board: 'string',
	// 		/** Display name for the whiteboard. */
	// 		name: 'string'
	// 	},
	// 	socket: sse,
	// 	browser
	// });

	// export type MatchWhiteboardData = StructData<typeof MatchWhiteboards.data.structure>;

	// export const Whiteboards = new Struct({
	// 	name: 'whiteboards',
	// 	structure: {
	// 		name: 'string',
	// 		strategyId: 'string'
	// 	},
	// 	socket: sse,
	// 	browser
	// });

	// export type WhiteboardData = StructData<typeof Whiteboards.data.structure>;
	// export type WhiteboardArr = DataArr<typeof Whiteboards.data.structure>;

	export const Strategy = new Struct({
		name: 'strategy',
		structure: {
			/** Strategy display name. */
			name: 'string',
			/** Account id that created the strategy. */
			createdBy: 'string',
			/** Event key this strategy targets. */
			eventKey: 'string',
			/** Alliance color for the strategy (red/blue). */
			alliance: 'string',

			/** Match number for the strategy. */
			matchNumber: 'number',
			/** Competition level for the strategy match. */
			compLevel: 'string',

			/** Partner team 1 number. */
			partner1: 'string',
			/** Partner team 2 number. */
			partner2: 'string',
			/** Partner team 3 number. */
			partner3: 'string',

			/** Opponent team 1 number. */
			opponent1: 'string',
			/** Opponent team 2 number. */
			opponent2: 'string',
			/** Opponent team 3 number. */
			opponent3: 'string',

			/** Freeform notes for the strategy. */
			notes: 'string',

			/** Serialized whiteboard data for the strategy. */
			board: 'string'
		},
		socket: sse,
		browser
	});

	export class StrategyExtended extends WritableBase<{
		strategy: StrategyData;
		whiteboard: Board;
		partner1: PartnerData;
		partner2: PartnerData;
		partner3: PartnerData;
		opponent1: OpponentData;
		opponent2: OpponentData;
		opponent3: OpponentData;
	}> {
		public static from(
			strategy: StrategyData,
			partners: [PartnerData, PartnerData, PartnerData],
			opponents: [OpponentData, OpponentData, OpponentData],
			match?: TBAMatch
		) {
			return attempt(() => {
				const whiteboard = Board.from(String(strategy.data.board), match).unwrap();
				return new StrategyExtended({
					strategy: strategy,
					whiteboard,
					partner1: partners[0],
					partner2: partners[1],
					partner3: partners[2],
					opponent1: opponents[0],
					opponent2: opponents[1],
					opponent3: opponents[2]
				});
			});
		}

		get name() {
			return this.data.strategy.derive((s) => s.name);
		}

		get notes() {
			return this.data.strategy.derive((s) => s.notes);
		}

		get strategy() {
			return this.data.strategy;
		}

		get board() {
			return this.data.whiteboard;
		}

		get partners() {
			return [this.data.partner1, this.data.partner2, this.data.partner3] as [
				PartnerData,
				PartnerData,
				PartnerData
			];
		}

		get opponents() {
			return [this.data.opponent1, this.data.opponent2, this.data.opponent3] as [
				OpponentData,
				OpponentData,
				OpponentData
			];
		}

		constructor(data: {
			strategy: StrategyData;
			whiteboard: Board;
			partner1: PartnerData;
			partner2: PartnerData;
			partner3: PartnerData;
			opponent1: OpponentData;
			opponent2: OpponentData;
			opponent3: OpponentData;
		}) {
			super(data);
			this.pipe(data.strategy);
			this.pipe(data.partner1);
			this.pipe(data.partner2);
			this.pipe(data.partner3);
			this.pipe(data.opponent1);
			this.pipe(data.opponent2);
			this.pipe(data.opponent3);

			data.whiteboard.on('change', () => {
				this.save();
			});

			this.onAllUnsubscribe(
				data.strategy.subscribe(({ board }) => {
					if (board === data.whiteboard.serialize()) return;
					const whiteboard = Board.from(String(board));
					if (whiteboard.isOk()) {
						data.whiteboard.setState(whiteboard.unwrap().data);
					} else {
						console.error('Failed to parse whiteboard data:', whiteboard.error);
					}
				})
			);
		}

		save() {
			return this.strategy.update((data) => {
				return {
					...data,
					board: this.board.serialize()
				};
			});
		}

		getPartnerScouting() {
			return attempt(() => {
				return [this.data.partner1, this.data.partner2, this.data.partner3].map((partner) => {
					const ms = Scouting.scoutingFromTeam(
						Number(partner.data.number),
						String(this.data.strategy.data.eventKey)
					);
					const arr = Scouting.MatchScoutingExtendedArr.fromArr(
						ms,
						Number(partner.data.number)
					).unwrap();
					this.pipe(arr);
					return arr;
				});
			});
		}

		getOpponentScouting() {
			return attempt(() => {
				return [this.data.opponent1, this.data.opponent2, this.data.opponent3].map((opponent) => {
					const ms = Scouting.scoutingFromTeam(
						Number(opponent.data.number),
						String(this.data.strategy.data.eventKey)
					);
					const arr = Scouting.MatchScoutingExtendedArr.fromArr(
						ms,
						Number(opponent.data.number)
					).unwrap();
					this.pipe(arr);
					return arr;
				});
			});
		}
	}

	/**
	 * Fetch strategy records that match the event and match identifiers.
	 *
	 * @returns {ReturnType<typeof Strategy.get>} Struct query result.
	 *
	 * @example
	 * ```ts
	 * const strategies = Strategy.fromMatch('2025miket', 12, 'qm');
	 * ```
	 */
	export const fromMatch = (eventKey: string, matchNumber: number, compLevel: string) => {
		return attemptAsync(async () => {
			const data = await remote.fromMatch({ eventKey, matchNumber, compLevel });
			return data.map((d) => {
				const strategy = Strategy.Generator(d.strategy);
				const partners = d.partners.map((p) => Partners.Generator(p));
				const opponents = d.opponents.map((o) => Opponents.Generator(o));
				return StrategyExtended.from(
					strategy,
					partners as [PartnerData, PartnerData, PartnerData],
					opponents as [OpponentData, OpponentData, OpponentData]
				).unwrap();
			});
		});
	};

	export const fromId = (id: string, matches: TBAMatch[] = []) => {
		return attemptAsync(async () => {
			const data = await remote.fromId({ id });
			const strategy = Strategy.Generator(data.strategy);
			const partners = data.partners.map((p) => Partners.Generator(p));
			const opponents = data.opponents.map((o) => Opponents.Generator(o));
			const match = matches.find((m) => {
				return (
					m.tba.event_key === data.strategy.eventKey &&
					m.tba.match_number === data.strategy.matchNumber &&
					m.tba.comp_level === data.strategy.compLevel
				);
			});
			return StrategyExtended.from(
				strategy,
				partners as [PartnerData, PartnerData, PartnerData],
				opponents as [OpponentData, OpponentData, OpponentData],
				match
			).unwrap();
		});
	};

	export type StrategyData = StructData<typeof Strategy.data.structure>;
	export type StrategyArr = DataArr<typeof Strategy.data.structure>;

	export const Partners = new Struct({
		name: 'strategy_partners',
		structure: {
			/** Starting position description. */
			startingPosition: 'string',
			/** Auto plan notes. */
			auto: 'string',
			/** Post-auto plan notes. */
			postAuto: 'string',
			/** Assigned role for the partner. */
			role: 'string',
			/** Endgame plan notes. */
			endgame: 'string',
			/** Freeform notes. */
			notes: 'string',
			/** Team Number */
			number: 'number'
		},
		socket: sse,
		browser
	});

	export type PartnerData = StructData<typeof Partners.data.structure>;
	export type PartnerArr = DataArr<typeof Partners.data.structure>;

	export const Opponents = new Struct({
		name: 'strategy_opponents',
		structure: {
			/** Post-auto plan notes. */
			postAuto: 'string',
			/** Assigned role for the opponent. */
			role: 'string',
			/** Freeform notes. */
			notes: 'string',
			/** Team Number */
			number: 'number',
			/** Auto plan notes. */
			auto: 'string',
			/** Endgame plan notes. */
			endgame: 'string'
		},
		socket: sse,
		browser
	});
	export type OpponentData = StructData<typeof Opponents.data.structure>;
	export type OpponentArr = DataArr<typeof Opponents.data.structure>;

	// export const Alliances = new Struct({
	// 	name: 'alliances',
	// 	structure: {
	// 		name: 'string',
	// 		eventKey: 'string',
	// 		team1: 'number',
	// 		team2: 'number',
	// 		team3: 'number',
	// 		team4: 'number'
	// 	},
	// 	socket: sse,
	// 	browser
	// });

	// export type AlliancesData = StructData<typeof Alliances.data.structure>;
	// export type AlliancesArr = DataArr<typeof Alliances.data.structure>;

	export const create = (config: { match: TBAMatch; name: string; alliance: 'red' | 'blue' }) => {
		return attemptAsync(async () => {
			const [r1, r2, r3, b1, b2, b3] = teamsFromMatch(config.match.tba);
			const partners = config.alliance === 'red' ? [r1, r2, r3] : [b1, b2, b3];
			const opponents = config.alliance === 'red' ? [b1, b2, b3] : [r1, r2, r3];

			return Strategy.Generator(
				await remote.create({
					eventKey: config.match.tba.event_key,
					matchNumber: config.match.tba.match_number,
					compLevel: config.match.tba.comp_level,
					name: config.name,
					alliance: config.alliance,
					partners: partners as [number, number, number],
					opponents: opponents as [number, number, number]
				})
			);
		});
	};
}
