import { integer, text } from 'drizzle-orm/pg-core';
import { Struct, StructData, StructStream } from 'drizzle-struct/back-end';
import { attemptAsync, resolveAll } from 'ts-utils/check';
import { DB } from '../db';
import { and, eq } from 'drizzle-orm';
import { Account } from './account';
import { Permissions } from './permissions';
import { z } from 'zod';

export namespace Strategy {
	export const Whiteboards = new Struct({
		name: 'whiteboards',
		structure: {
			strategyId: text('strategy_id').notNull(),
			board: text('board').notNull(),
			name: text('name').notNull()
		}
	});

	export const Strategy = new Struct({
		name: 'strategy',
		structure: {
			eventKey: text('event_key').notNull(),
			name: text('name').notNull(),
			createdBy: text('created_by').notNull(),
			alliance: text('alliance').notNull(),
			type: text('type').notNull(),

			matchNumber: integer('match_number').notNull(), // -1 for not applicable (type != 'match')
			compLevel: text('comp_level').notNull(), // na for not applicable (type != 'match')

			partner1: integer('partner1').notNull(),
			partner2: integer('partner2').notNull(),
			partner3: integer('partner3').notNull(),

			opponent1: integer('opponent1').notNull(),
			opponent2: integer('opponent2').notNull(),
			opponent3: integer('opponent3').notNull()
		},
		validators: {
			alliance: (value) => ['red', 'blue', 'unknown'].includes(String(value))
		}
	});

	Strategy.queryListen('from-match', async (event, data) => {
		if (!event.locals.account) return new Error('Not logged in');
		if (!(await Account.isAdmin(event.locals.account).unwrap())) {
			return new Error('Not entitled');
		}

		const parsed = z
			.object({
				eventKey: z.string(),
				matchNumber: z.number(),
				compLevel: z.string()
			})
			.safeParse(data);
		if (!parsed.success) return new Error('Invalid data: ' + parsed.error.message);

		const { eventKey, matchNumber, compLevel } = parsed.data;
		const res = await getMatchStrategy(matchNumber, compLevel, eventKey);
		if (res.isErr()) return new Error('Error getting strategy: ' + res.error.message);
		return res.value;
		// const strategies = res.value;
		// const stream = new StructStream(Strategy);
		// setTimeout(() => {
		// 	for (const strategy of strategies) {
		// 		stream.add(strategy);
		// 	}
		// }, event.locals.session.data.latency);
		// return stream;
	});

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
		Partners.fromProperty('strategyId', strategy.id, { type: 'stream' }).pipe((p) => p.delete());
		Opponents.fromProperty('strategyId', strategy.id, { type: 'stream' }).pipe((p) => p.delete());
	});

	Strategy.on('archive', (strategy) => {
		Partners.fromProperty('strategyId', strategy.id, { type: 'stream' }).pipe((p) =>
			p.setArchive(true)
		);
		Opponents.fromProperty('strategyId', strategy.id, { type: 'stream' }).pipe((p) =>
			p.setArchive(true)
		);
	});

	Strategy.on('restore', (strategy) => {
		Partners.fromProperty('strategyId', strategy.id, { type: 'stream' }).pipe((p) =>
			p.setArchive(false)
		);
		Opponents.fromProperty('strategyId', strategy.id, { type: 'stream' }).pipe((p) =>
			p.setArchive(false)
		);
	});

	// I'm unsure I want this, probably should just be a confirmation on the front end
	// Strategy.on('update', ({ from , to }) => {
	// 	const resetPartner = async (position: number) => {
	// 		const partners = await Partners.fromProperty('strategyId', to.id, { type: 'stream' }).await().unwrap();
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
	// 		const opponents = await Opponents.fromProperty('strategyId', to.id, { type: 'stream' }).await().unwrap();
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
			strategyId: text('strategy_id').notNull(),
			position: integer('position').notNull(), // 1, 2, 3

			startingPosition: text('starting_position').notNull(),
			auto: text('auto').notNull(),
			postAuto: text('post_auto').notNull(),
			role: text('role').notNull(),
			endgame: text('endgame').notNull(),
			notes: text('notes').notNull()
		}
	});

	export type PartnerData = StructData<typeof Partners.data.structure>;

	export const Opponents = new Struct({
		name: 'strategy_opponents',
		structure: {
			strategyId: text('strategy_id').notNull(),
			position: integer('position').notNull(), // 1, 2, 3

			postAuto: text('post_auto').notNull(),
			role: text('role').notNull(),
			notes: text('notes').notNull()
		}
	});

	export type OpponentData = StructData<typeof Opponents.data.structure>;

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

	export const getStrategy = (strategy: StrategyData) => {
		return attemptAsync(async () => {
			const partners = await Partners.fromProperty('strategyId', strategy.id, { type: 'stream' })
				.await()
				.unwrap();
			const opponents = await Opponents.fromProperty('strategyId', strategy.id, { type: 'stream' })
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
			name: text('name').notNull(),
			eventKey: text('event_key').notNull(),
			team1: integer('team1').notNull(),
			team2: integer('team2').notNull(),
			team3: integer('team3').notNull(),
			team4: integer('team4').notNull()
		}
	});

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
