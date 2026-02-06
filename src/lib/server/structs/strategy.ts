/**
 * @fileoverview Server-side strategy Structs and retrieval helpers.
 *
 * @description
 * Defines Drizzle-backed Structs for strategies, partners, opponents, and whiteboards.
 */
import { integer, text } from 'drizzle-orm/pg-core';
import { Struct, StructData } from 'drizzle-struct';
import { attemptAsync } from 'ts-utils/check';
import { DB } from '../db';
import { and, eq } from 'drizzle-orm';
import { Permissions } from './permissions';
import structRegistry from '../services/struct-registry';

export namespace Strategy {
	export const MatchWhiteboards = new Struct({
		name: 'match_whiteboards',
		structure: {
			/** Event key for the whiteboard. */
			eventKey: text('event_key').notNull(),
			/** Match number. */
			matchNumber: integer('match_number').notNull(),
			/** Competition level (qm, qf, sf, f). */
			compLevel: text('comp_level').notNull(),
			/** Serialized whiteboard data. */
			board: text('board').notNull(),
			/** Display name for the whiteboard. */
			name: text('name').notNull()
		}
	});

	structRegistry.register(MatchWhiteboards);

	export type MatchWhiteboardData = StructData<typeof MatchWhiteboards.data.structure>;

	export const Whiteboards = new Struct({
		name: 'whiteboards',
		structure: {
			/** Parent strategy id. */
			strategyId: text('strategy_id').notNull(),
			/** Serialized whiteboard data. */
			board: text('board').notNull(),
			/** Display name for the whiteboard. */
			name: text('name').notNull()
		}
	});

	structRegistry.register(Whiteboards);

	export const Strategy = new Struct({
		name: 'strategy',
		structure: {
			/** Event key for the strategy. */
			eventKey: text('event_key').notNull(),
			/** Strategy display name. */
			name: text('name').notNull(),
			/** Account id that created the strategy. */
			createdBy: text('created_by').notNull(),
			/** Alliance color for the strategy. */
			alliance: text('alliance').notNull(),
			/** Strategy type/category. */
			type: text('type').notNull(),

			/** Match number (or -1 if not applicable). */
			matchNumber: integer('match_number').notNull(), // -1 for not applicable (type != 'match')
			/** Competition level (or 'na' if not applicable). */
			compLevel: text('comp_level').notNull(), // na for not applicable (type != 'match')

			/** Partner team 1 number. */
			partner1: integer('partner1').notNull(),
			/** Partner team 2 number. */
			partner2: integer('partner2').notNull(),
			/** Partner team 3 number. */
			partner3: integer('partner3').notNull(),

			/** Opponent team 1 number. */
			opponent1: integer('opponent1').notNull(),
			/** Opponent team 2 number. */
			opponent2: integer('opponent2').notNull(),
			/** Opponent team 3 number. */
			opponent3: integer('opponent3').notNull()
		},
		validators: {
			alliance: (value) => ['red', 'blue', 'unknown'].includes(String(value))
		}
	});

	structRegistry.register(Strategy);

	Strategy.on('create', (strategy) => {
		// generate partners
		const partner = (position: number) =>
			Partners.new({
				strategyId: strategy.id,
				position,

				startingPosition: '',
				auto: '',
				postAuto: '',
				role: '',
				endgame: '',
				notes: ''
			});

		const opponent = (position: number) =>
			Opponents.new({
				strategyId: strategy.id,
				position,
				postAuto: '',
				role: '',
				notes: ''
			});

		partner(1);
		partner(2);
		partner(3);
		opponent(1);
		opponent(2);
		opponent(3);
	});

	Strategy.on('delete', (strategy) => {
		Partners.get({ strategyId: strategy.id }, { type: 'stream' }).pipe((p) => p.delete());
		Opponents.get({ strategyId: strategy.id }, { type: 'stream' }).pipe((p) => p.delete());
	});

	Strategy.on('archive', (strategy) => {
		Partners.get({ strategyId: strategy.id }, { type: 'stream' }).pipe((p) => p.setArchive(true));
		Opponents.get({ strategyId: strategy.id }, { type: 'stream' }).pipe((p) => p.setArchive(true));
	});

	Strategy.on('restore', (strategy) => {
		Partners.get({ strategyId: strategy.id }, { type: 'stream' }).pipe((p) => p.setArchive(false));
		Opponents.get({ strategyId: strategy.id }, { type: 'stream' }).pipe((p) => p.setArchive(false));
	});

	// I'm unsure I want this, probably should just be a confirmation on the front end
	// Strategy.on('update', ({ from , to }) => {
	// 	const resetPartner = async (position: number) => {
	// 		const partners = await Partners.get({'strategyId': to.id}, { type: 'stream' }).await().unwrap();
	// 		const partner = partners.find(p => p.data.position === position);
	// 		if (!partner) return;

	// 		partner.update({
	// 			startingPosition: '',
	// 			auto: '',
	// 			postAuto: '',
	// 			role: '',
	// 			endgame: '',
	// 			notes: ''
	// 		});
	// 	};

	// 	const resetOpponent = async (position: number) => {
	// 		const opponents = await Opponents.get({'strategyId': to.id}, { type: 'stream' }).await().unwrap();
	// 		const opponent = opponents.find(o => o.data.position === position);
	// 		if (!opponent) return;

	// 		opponent.update({
	// 			postAuto: '',
	// 			role: '',
	// 			notes: ''
	// 		});
	// 	};

	// 	if (from.partner1 !== to.data.partner1) resetPartner(1);
	// 	if (from.partner2 !== to.data.partner2) resetPartner(2);
	// 	if (from.partner3 !== to.data.partner3) resetPartner(3);
	// 	if (from.opponent1 !== to.data.opponent1) resetOpponent(1);
	// 	if (from.opponent2 !== to.data.opponent2) resetOpponent(2);
	// 	if (from.opponent3 !== to.data.opponent3) resetOpponent(3);
	// });

	export type StrategyData = StructData<typeof Strategy.data.structure>;

	export const Partners = new Struct({
		name: 'strategy_partners',
		structure: {
			/** Parent strategy id. */
			strategyId: text('strategy_id').notNull(),
			/** Partner position (1-3). */
			position: integer('position').notNull(), // 1, 2, 3

			/** Starting position notes. */
			startingPosition: text('starting_position').notNull(),
			/** Auto plan notes. */
			auto: text('auto').notNull(),
			/** Post-auto plan notes. */
			postAuto: text('post_auto').notNull(),
			/** Role notes. */
			role: text('role').notNull(),
			/** Endgame plan notes. */
			endgame: text('endgame').notNull(),
			/** Freeform notes. */
			notes: text('notes').notNull()
		}
	});

	structRegistry.register(Partners);

	export type PartnerData = StructData<typeof Partners.data.structure>;

	export const Opponents = new Struct({
		name: 'strategy_opponents',
		structure: {
			/** Parent strategy id. */
			strategyId: text('strategy_id').notNull(),
			/** Opponent position (1-3). */
			position: integer('position').notNull(), // 1, 2, 3

			/** Post-auto plan notes. */
			postAuto: text('post_auto').notNull(),
			/** Role notes. */
			role: text('role').notNull(),
			/** Freeform notes. */
			notes: text('notes').notNull()
		}
	});

	structRegistry.register(Opponents);

	export type OpponentData = StructData<typeof Opponents.data.structure>;

	/**
	 * Fetch strategies matching a specific event and match.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing strategies.
	 */
	export const getMatchStrategy = (matchNumber: number, compLevel: string, eventKey: string) => {
		return attemptAsync(async () => {
			const res = await DB.select()
				.from(Strategy.table)
				.where(
					and(
						eq(Strategy.table.matchNumber, matchNumber),
						eq(Strategy.table.compLevel, compLevel),
						eq(Strategy.table.eventKey, eventKey)
					)
				);
			return res.map((s) => Strategy.Generator(s));
		});
	};

	/**
	 * Fetch a strategy with its partners and opponents.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing the strategy bundle.
	 */
	export const getStrategy = (strategy: StrategyData) => {
		return attemptAsync(async () => {
			const partners = await Partners.get({ strategyId: strategy.id }, { type: 'stream' })
				.await()
				.unwrap();
			const opponents = await Opponents.get({ strategyId: strategy.id }, { type: 'stream' })
				.await()
				.unwrap();
			if (partners.length !== 3)
				throw new Error('Partners length is not correct: ' + partners.length);
			if (opponents.length !== 3)
				throw new Error('Opponents length is not correct: ' + opponents.length);

			return {
				strategy,
				partners: partners.sort((a, b) => a.data.position - b.data.position),
				opponents: opponents.sort((a, b) => a.data.position - b.data.position)
			};
		});
	};

	export const Alliances = new Struct({
		name: 'alliances',
		structure: {
			/** Alliance display name. */
			name: text('name').notNull(),
			/** Event key for the alliance. */
			eventKey: text('event_key').notNull(),
			/** Alliance team 1 number. */
			team1: integer('team1').notNull(),
			/** Alliance team 2 number. */
			team2: integer('team2').notNull(),
			/** Alliance team 3 number. */
			team3: integer('team3').notNull(),
			/** Alliance team 4 number. */
			team4: integer('team4').notNull()
		}
	});

	structRegistry.register(Alliances);

	Permissions.createEntitlement({
		name: 'view-strategy',
		structs: [Whiteboards, Strategy, Alliances],
		permissions: ['whiteboards:read:*', 'strategy:read:*', 'alliances:read:*'],
		group: 'Strategy',
		description: 'View strategy information',
		features: []
	});
}

export const _strategyWhiteboardsTable = Strategy.Whiteboards.table;
export const _strategyTable = Strategy.Strategy.table;
export const _strategyAlliancesTable = Strategy.Alliances.table;
export const _strategyPartnersTable = Strategy.Partners.table;
export const _strategyOpponentsTable = Strategy.Opponents.table;
export const _matchWhiteboardsTable = Strategy.MatchWhiteboards.table;
