import { type DataArr } from '$lib/services/struct/data-arr';
import { Struct } from '$lib/services/struct';
import { StructData } from '$lib/services/struct';
import { sse } from '../services/sse';
import { browser } from '$app/environment';

export namespace Strategy {
	export const MatchWhiteboards = new Struct({
		name: 'match_whiteboards',
		structure: {
			eventKey: 'string',
			matchNumber: 'number',
			compLevel: 'string',
			board: 'string',
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
			name: 'string',
			createdBy: 'string',
			eventKey: 'string',
			alliance: 'string',
			type: 'string',

			matchNumber: 'number',
			compLevel: 'string',

			partner1: 'number',
			partner2: 'number',
			partner3: 'number',

			opponent1: 'number',
			opponent2: 'number',
			opponent3: 'number'
		},
		socket: sse,
		browser
	});

	export const fromMatch = (eventKey: string, matchNumber: number, compLevel: string) => {
		return Strategy.query(
			'from-match',
			{
				eventKey,
				matchNumber,
				compLevel
			},
			{
				asStream: false,
				satisfies: (data) =>
					data.data.eventKey === eventKey &&
					data.data.matchNumber === matchNumber &&
					data.data.compLevel === compLevel
			}
		);
	};

	export type StrategyData = StructData<typeof Strategy.data.structure>;
	export type StrategyArr = DataArr<typeof Strategy.data.structure>;

	export const Partners = new Struct({
		name: 'strategy_partners',
		structure: {
			strategyId: 'string',
			position: 'number',

			startingPosition: 'string',
			auto: 'string',
			postAuto: 'string',
			role: 'string',
			endgame: 'string',
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
			strategyId: 'string',
			position: 'number',

			postAuto: 'string',
			role: 'string',
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
