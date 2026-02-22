/**
 * @fileoverview Server-side strategy Structs and retrieval helpers.
 *
 * @description
 * Defines Drizzle-backed Structs for strategies, partners, opponents, and whiteboards.
 */
import { integer, text } from 'drizzle-orm/pg-core';
import { Struct, StructData } from 'drizzle-struct';
import { attemptAsync } from 'ts-utils/check';
import { Permissions } from './permissions';
import structRegistry from '../services/struct-registry';
import terminal from '../utils/terminal';

export namespace Strategy {
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

			/** Match number (or -1 if not applicable). */
			matchNumber: integer('match_number').notNull(), // -1 for not applicable (type != 'match')
			/** Competition level (or 'na' if not applicable). */
			compLevel: text('comp_level').notNull(), // na for not applicable (type != 'match')

			/** Partner team 1 number. */
			partner1: text('partner1').notNull(),
			/** Partner team 2 number. */
			partner2: text('partner2').notNull(),
			/** Partner team 3 number. */
			partner3: text('partner3').notNull(),

			/** Opponent team 1 number. */
			opponent1: text('opponent1').notNull(),
			/** Opponent team 2 number. */
			opponent2: text('opponent2').notNull(),
			/** Opponent team 3 number. */
			opponent3: text('opponent3').notNull(),

			/** Freeform notes for the strategy. */
			notes: text('notes').notNull(),

			/** Serialized whiteboard data for the strategy. */
			board: text('board').notNull()
		},
		validators: {
			alliance: (value) => ['red', 'blue', 'unknown'].includes(String(value))
		}
	});

	structRegistry.register(Strategy);

	export const createStrategy = (config: {
		eventKey: string;
		name: string;
		createdBy: string;
		alliance: 'red' | 'blue';
		matchNumber: number;
		compLevel: string;
		partners: [number, number, number];
		opponents: [number, number, number];
	}) => {
		return attemptAsync(async () => {
			const { partners, opponents, ...strategyConfig } = config;
			if (partners.length !== 3) {
				throw new Error(
					'Partners length is not correct: ' +
						partners.length +
						' - Must be 3 partners for a strategy'
				);
			}
			if (opponents.length !== 3) {
				throw new Error(
					'Opponents length is not correct: ' +
						opponents.length +
						' - Must be 3 opponents for a strategy'
				);
			}
			const defaultPartner = {
				startingPosition: '',
				auto: '',
				postAuto: '',
				role: '',
				endgame: '',
				notes: ''
			};
			const defaultOpponent = {
				auto: '',
				postAuto: '',
				endgame: '',
				role: '',
				notes: ''
			};
			const [p1, p2, p3, o1, o2, o3] = await Promise.all([
				Partners.new({
					...defaultPartner,
					number: partners[0]
				}).unwrap(),
				Partners.new({
					...defaultPartner,
					number: partners[1]
				}).unwrap(),
				Partners.new({
					...defaultPartner,
					number: partners[2]
				}).unwrap(),
				Opponents.new({
					...defaultOpponent,
					number: opponents[0]
				}).unwrap(),
				Opponents.new({
					...defaultOpponent,
					number: opponents[1]
				}).unwrap(),
				Opponents.new({
					...defaultOpponent,
					number: opponents[2]
				}).unwrap()
			]);

			return Strategy.new({
				...strategyConfig,
				partner1: p1.id,
				partner2: p2.id,
				partner3: p3.id,
				opponent1: o1.id,
				opponent2: o2.id,
				opponent3: o3.id,
				alliance: config.alliance,
				notes: '',
				board: JSON.stringify({
					comments: [],
					paths: []
				})
			}).unwrap();
		});
	};

	Strategy.on('delete', async (strategy) => {
		try {
			// delete partners/opponents
			const partners = await Partners.fromIds(
				[strategy.data.partner1, strategy.data.partner2, strategy.data.partner3],
				{
					type: 'all'
				}
			).unwrap();
			const opponents = await Opponents.fromIds(
				[strategy.data.opponent1, strategy.data.opponent2, strategy.data.opponent3],
				{
					type: 'all'
				}
			).unwrap();
			for (const data of [...partners, ...opponents]) {
				await data.delete().unwrap();
			}
		} catch (error) {
			terminal.error(
				'Failed to delete strategy partners/opponents when deleting strategy: ' + strategy.id,
				error
			);
		}
	});

	Strategy.on('archive', async (strategy) => {
		try {
			const partners = await Partners.fromIds(
				[strategy.data.partner1, strategy.data.partner2, strategy.data.partner3],
				{
					type: 'all'
				}
			).unwrap();
			const opponents = await Opponents.fromIds(
				[strategy.data.opponent1, strategy.data.opponent2, strategy.data.opponent3],
				{
					type: 'all'
				}
			).unwrap();
			for (const data of [...partners, ...opponents]) {
				data.setArchive(true).unwrap();
			}
		} catch (error) {
			terminal.error(
				'Failed to archive strategy partners/opponents when archiving strategy: ' + strategy.id,
				error
			);
		}
	});

	Strategy.on('restore', async (strategy) => {
		try {
			const partners = await Partners.fromIds(
				[strategy.data.partner1, strategy.data.partner2, strategy.data.partner3],
				{
					type: 'all'
				}
			).unwrap();
			const opponents = await Opponents.fromIds(
				[strategy.data.opponent1, strategy.data.opponent2, strategy.data.opponent3],
				{
					type: 'all'
				}
			).unwrap();
			for (const data of [...partners, ...opponents]) {
				data.setArchive(false).unwrap();
			}
		} catch (error) {
			terminal.error(
				'Failed to restore strategy partners/opponents when restoring strategy: ' + strategy.id,
				error
			);
		}
	});

	export type StrategyData = StructData<typeof Strategy.data.structure>;

	export const Partners = new Struct({
		name: 'strategy_partners',
		structure: {
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
			notes: text('notes').notNull(),
			/** Team Number */
			number: integer('number').notNull()
		}
	});

	structRegistry.register(Partners);

	export type PartnerData = StructData<typeof Partners.data.structure>;
	export const getPartners = (strategy: StrategyData) => {
		return attemptAsync(async () => {
			const partners = await Partners.fromIds(
				[strategy.data.partner1, strategy.data.partner2, strategy.data.partner3],
				{
					type: 'all'
				}
			).unwrap();

			if (partners.length !== 3)
				throw new Error(
					'Partners length is not correct: ' +
						partners.length +
						' - Must be 3 partners for a strategy'
				);
			const order = [strategy.data.partner1, strategy.data.partner2, strategy.data.partner3];
			return partners.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
		});
	};
	export const Opponents = new Struct({
		name: 'strategy_opponents',
		structure: {
			auto: text('auto').notNull(),
			/** Post-auto plan notes. */
			postAuto: text('post_auto').notNull(),
			/** Role notes. */
			role: text('role').notNull(),
			/** Freeform notes. */
			notes: text('notes').notNull(),
			/** Team Number  */
			number: integer('number').notNull(),
			/** Endgame plan notes. */
			endgame: text('endgame').notNull()
		}
	});

	structRegistry.register(Opponents);

	export type OpponentData = StructData<typeof Opponents.data.structure>;
	export const getOpponents = (strategy: StrategyData) => {
		return attemptAsync(async () => {
			const opponents = await Opponents.fromIds(
				[strategy.data.opponent1, strategy.data.opponent2, strategy.data.opponent3],
				{
					type: 'all'
				}
			).unwrap();

			if (opponents.length !== 3)
				throw new Error(
					'Opponents length is not correct: ' +
						opponents.length +
						' - Must be 3 opponents for a strategy'
				);
			const order = [strategy.data.opponent1, strategy.data.opponent2, strategy.data.opponent3];
			return opponents.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
		});
	};

	/**
	 * Fetch strategies matching a specific event and match.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing strategies.
	 */
	export const getMatchStrategy = (matchNumber: number, compLevel: string, eventKey: string) => {
		return Strategy.get(
			{
				matchNumber,
				compLevel,
				eventKey
			},
			{
				type: 'all'
			}
		);
	};

	/**
	 * Fetch a strategy with its partners and opponents.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing the strategy bundle.
	 */
	export const getStrategy = (strategy: StrategyData) => {
		return attemptAsync(async () => {
			return {
				strategy,
				partners: await getPartners(strategy).unwrap(),
				opponents: await getOpponents(strategy).unwrap()
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
		structs: [Strategy, Alliances],
		permissions: ['strategy:read:*', 'alliances:read:*'],
		group: 'Strategy',
		description: 'View strategy information',
		features: []
	});
}

export const _strategyTable = Strategy.Strategy.table;
export const _strategyAlliancesTable = Strategy.Alliances.table;
export const _strategyPartnersTable = Strategy.Partners.table;
export const _strategyOpponentsTable = Strategy.Opponents.table;
