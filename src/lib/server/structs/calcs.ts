import { integer, text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { attemptAsync } from 'ts-utils/check';

export namespace Calcs {
	export const Ranks = new Struct({
		name: 'calcs_ranks',
		structure: {
			eventKey: text('event_key').notNull(),
			team: integer('team').notNull(),
			data: text('data').notNull() // JSON Ranks Object
		}
	});
}

export const _ranks = Calcs.Ranks.table;
