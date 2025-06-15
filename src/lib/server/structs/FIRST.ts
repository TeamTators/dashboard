import { boolean } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct, StructStream } from 'drizzle-struct/back-end';
import { Permissions } from './permissions';
import { z } from 'zod';
import { DB } from '../db';
import { and, eq } from 'drizzle-orm';
import { attemptAsync } from 'ts-utils/check';

export namespace FIRST {
	export const TeamPictures = new Struct({
		name: 'team_pictures',
		structure: {
			team: integer('team').notNull(),
			eventKey: text('event_key').notNull(),
			picture: text('picture').notNull(),
			accountId: text('account_id').notNull()
		}
	});

	TeamPictures.queryListen('from-event', async (event, data) => {
		if (!event.locals.account) return new Error('Not logged in');

		// Check if the user has permission to view team pictures

		const { team, eventKey } = z
			.object({
				team: z.number(),
				eventKey: z.string()
			})
			.parse(data);

		return getTeamPictures(team, eventKey).unwrap();
	});

	export const getTeamPictures = (team: number, eventKey: string) => {
		return attemptAsync(async () => {
			const res = await DB.select()
				.from(TeamPictures.table)
				.where(and(eq(TeamPictures.table.team, team), eq(TeamPictures.table.eventKey, eventKey)));

			return res.map((r) => TeamPictures.Generator(r));
		});
	};

	// TeamPictures.on('delete', (pic) => {});

	export const Matches = new Struct({
		name: 'matches',
		structure: {
			eventKey: text('event_key').notNull(),
			number: integer('number').notNull(),
			compLevel: text('comp_level').notNull()
		}
	});

	export const CustomMatches = new Struct({
		name: 'custom_matches',
		structure: {
			name: text('name').notNull(),
			eventKey: text('event_key').notNull(),
			number: integer('number').notNull(),
			compLevel: text('comp_level').notNull(),
			red1: integer('red1').notNull(),
			red2: integer('red2').notNull(),
			red3: integer('red3').notNull(),
			red4: integer('red4').notNull(),
			blue1: integer('blue1').notNull(),
			blue2: integer('blue2').notNull(),
			blue3: integer('blue3').notNull(),
			blue4: integer('blue4').notNull()
		}
	});

	Permissions.createEntitlement({
		name: 'view-tba-info',
		structs: [TeamPictures, Matches, CustomMatches],
		group: 'FIRST',
		permissions: ['team_pictures:read:*', 'matches:read:*', 'custom_matches:*:*'],
		description: 'View FIRST team pictures and matches'
	});

	Permissions.createEntitlement({
		name: 'upload-pictures',
		structs: [TeamPictures],
		group: 'FIRST',
		permissions: ['team_pictures:create'],
		description: 'Upload team pictures for FIRST events'
	});
}

export const _firstTeamPicturesTable = FIRST.TeamPictures.table;
export const _firstMatchesTable = FIRST.Matches.table;
export const _firstCustomMatchesTable = FIRST.CustomMatches.table;
