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
	/**
	 * Struct for strategy records.
	 *
	 * @example
	 * const strategy = Strategy.Strategy.get({ eventKey: '2025miket' }, { type: 'all' });
	 */
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

	/**
	 * Extended wrapper for a strategy record, partners, opponents, and whiteboard.
	 *
	 * @example
	 * const ext = Strategy.StrategyExtended.from(strategy, partners, opponents);
	 */
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
		/**
		 * Create an extended wrapper from strategy, partners, opponents, and optional match.
		 * @param strategy - Strategy record.
		 * @param partners - Array of partner records.
		 * @param opponents - Array of opponent records.
		 * @param match - Optional TBAMatch for whiteboard context.
		 * @returns Attempt-wrapped extended strategy.
		 * @example
		 * const ext = Strategy.StrategyExtended.from(strategy, partners, opponents, match).unwrap();
		 */
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

		/**
		 * Reactive derived store for strategy name.
		 * @returns Derived writable for name.
		 */
		get name() {
			return this.data.strategy.derive((s) => s.name);
		}

		/**
		 * Reactive derived store for strategy notes.
		 * @returns Derived writable for notes.
		 */
		get notes() {
			return this.data.strategy.derive((s) => s.notes);
		}

		/**
		 * Access the underlying strategy record.
		 * @returns StrategyData instance.
		 */
		get strategy() {
			return this.data.strategy;
		}

		/**
		 * Access the whiteboard instance.
		 * @returns Board instance.
		 */
		get board() {
			return this.data.whiteboard;
		}

		/**
		 * Array of partner records.
		 * @returns Array of PartnerData.
		 */
		get partners() {
			return [this.data.partner1, this.data.partner2, this.data.partner3] as [
				PartnerData,
				PartnerData,
				PartnerData
			];
		}

		/**
		 * Array of opponent records.
		 * @returns Array of OpponentData.
		 */
		get opponents() {
			return [this.data.opponent1, this.data.opponent2, this.data.opponent3] as [
				OpponentData,
				OpponentData,
				OpponentData
			];
		}

		/**
		 * Construct an extended strategy wrapper.
		 * @param data - Object containing strategy, whiteboard, partners, and opponents.
		 */
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

		/**
		 * Save the current whiteboard state to the strategy record.
		 * @returns Update result.
		 */
		save() {
			return this.strategy.update((data) => {
				return {
					...data,
					board: this.board.serialize()
				};
			});
		}

		/**
		 * Fetch scouting data for all partners.
		 * @returns Array of MatchScoutingExtendedArr for each partner.
		 */
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

		/**
		 * Fetch scouting data for all opponents.
		 * @returns Array of MatchScoutingExtendedArr for each opponent.
		 */
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
	 * @param eventKey - Event key.
	 * @param matchNumber - Match number.
	 * @param compLevel - Competition level.
	 * @returns AttemptAsync-wrapped array of StrategyExtended.
	 * @example
	 * const strategies = Strategy.fromMatch('2025miket', 12, 'qm');
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

	/**
	 * Fetch a strategy record by id, optionally matching against provided TBAMatch array.
	 * @param id - Strategy record id.
	 * @param matches - Optional array of TBAMatch.
	 * @returns AttemptAsync-wrapped StrategyExtended.
	 * @example
	 * const ext = await Strategy.fromId('abc123', matches).unwrap();
	 */
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

	/**
	 * Type for a strategy record.
	 * @example
	 * const s: Strategy.StrategyData = ...;
	 */
	export type StrategyData = StructData<typeof Strategy.data.structure>;
	/**
	 * Type for an array of strategy records.
	 * @example
	 * const arr: Strategy.StrategyArr = ...;
	 */
	export type StrategyArr = DataArr<typeof Strategy.data.structure>;

	/**
	 * Struct for partner records.
	 * @example
	 * const partner = Strategy.Partners.get({ number: 33 }, { type: 'all' });
	 */
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

	/**
	 * Type for a partner record.
	 * @example
	 * const p: Strategy.PartnerData = ...;
	 */
	export type PartnerData = StructData<typeof Partners.data.structure>;
	/**
	 * Type for an array of partner records.
	 * @example
	 * const arr: Strategy.PartnerArr = ...;
	 */
	export type PartnerArr = DataArr<typeof Partners.data.structure>;

	/**
	 * Struct for opponent records.
	 * @example
	 * const opponent = Strategy.Opponents.get({ number: 254 }, { type: 'all' });
	 */
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
	/**
	 * Type for an opponent record.
	 * @example
	 * const o: Strategy.OpponentData = ...;
	 */
	export type OpponentData = StructData<typeof Opponents.data.structure>;
	/**
	 * Type for an array of opponent records.
	 * @example
	 * const arr: Strategy.OpponentArr = ...;
	 */
	export type OpponentArr = DataArr<typeof Opponents.data.structure>;

	/**
	 * Create a new strategy record for a match and alliance.
	 * @param config - Object containing match, name, and alliance.
	 * @returns AttemptAsync-wrapped Strategy record.
	 * @example
	 * const s = await Strategy.create({ match, name: 'My Strat', alliance: 'red' }).unwrap();
	 */
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
