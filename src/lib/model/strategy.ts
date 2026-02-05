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

export namespace Strategy {
	export const MatchWhiteboards = new Struct({
		name: 'match_whiteboards',
		structure: {
			/** Event key this whiteboard belongs to. */
			eventKey: 'string',
			/** Match number for the whiteboard. */
			matchNumber: 'number',
			/** Competition level (qm, qf, sf, f). */
			compLevel: 'string',
			/** Serialized board data. */
			board: 'string',
			/** Display name for the whiteboard. */
			name: 'string'
		},
		socket: sse,
		browser
	});

	export type MatchWhiteboardData = StructData<typeof MatchWhiteboards.data.structure>;

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
			/** Strategy type or category. */
			type: 'string',

			/** Match number for the strategy. */
			matchNumber: 'number',
			/** Competition level for the strategy match. */
			compLevel: 'string',

			/** Partner team 1 number. */
			partner1: 'number',
			/** Partner team 2 number. */
			partner2: 'number',
			/** Partner team 3 number. */
			partner3: 'number',

			/** Opponent team 1 number. */
			opponent1: 'number',
			/** Opponent team 2 number. */
			opponent2: 'number',
			/** Opponent team 3 number. */
			opponent3: 'number'
		},
		socket: sse,
		browser
	});

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
		return Strategy.get(
			{
				eventKey,
				matchNumber,
				compLevel
			},
			{
				type: 'all'
			}
		);
	};

	export type StrategyData = StructData<typeof Strategy.data.structure>;
	export type StrategyArr = DataArr<typeof Strategy.data.structure>;

	export const Partners = new Struct({
		name: 'strategy_partners',
		structure: {
			/** Parent strategy id. */
			strategyId: 'string',
			/** Partner position in the alliance. */
			position: 'number',

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
			notes: 'string'
		},
		socket: sse,
		browser
	});

	export type PartnerData = StructData<typeof Partners.data.structure>;
	export type PartnerArr = DataArr<typeof Partners.data.structure>;

	export const Opponents = new Struct({
		name: 'strategy_opponents',
		structure: {
			/** Parent strategy id. */
			strategyId: 'string',
			/** Opponent position in the alliance. */
			position: 'number',

			/** Post-auto plan notes. */
			postAuto: 'string',
			/** Assigned role for the opponent. */
			role: 'string',
			/** Freeform notes. */
			notes: 'string'
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
}
