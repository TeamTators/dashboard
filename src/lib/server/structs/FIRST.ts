import { integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { Permissions } from './permissions';
import { z } from 'zod';
import { DB } from '../db';
import { and, eq } from 'drizzle-orm';
import { attemptAsync } from 'ts-utils/check';
import { SendListener } from '../services/struct-listeners';
import Summary2024 from '../../utils/trace/summaries/2024';
import Summary2025 from '../../utils/trace/summaries/2025';
import { Event } from '../utils/tba';
import { Scouting } from './scouting';
import { Trace } from 'tatorscout/trace';
import { DataAction, PropertyAction } from 'drizzle-struct/types';

export namespace FIRST {
	export const EventSummary = new Struct({
		name: 'event_summary',
		structure: {
			eventKey: text('event_key').notNull(),
			summary: text('summary').notNull()
		}
	});

	// Prevent SSE from doing anything
	EventSummary.block(DataAction.Archive, () => true, 'No archiving allowed');
	EventSummary.block(DataAction.Clear, () => true, 'No clearing allowed');
	EventSummary.block(DataAction.Create, () => true, 'No creating allowed');
	EventSummary.block(DataAction.Delete, () => true, 'No deleting allowed');
	EventSummary.block(DataAction.DeleteVersion, () => true, 'No deleting allowed');
	EventSummary.block(DataAction.RestoreArchive, () => true, 'No restoring allowed');
	EventSummary.block(DataAction.RestoreVersion, () => true, 'No restoring allowed');
	EventSummary.block(PropertyAction.Update, () => true, 'No updating allowed');
	EventSummary.block(PropertyAction.Read, () => true, 'No reading allowed');
	EventSummary.block(PropertyAction.ReadArchive, () => true, 'No reading allowed');
	EventSummary.block(PropertyAction.ReadVersionHistory, () => true, 'No reading allowed');
	EventSummary.block(PropertyAction.SetAttributes, () => true, 'No setting allowed');

	SendListener.on(
		'get-summary',
		EventSummary,
		z.object({
			eventKey: z.string(),
			year: z.number()
		}),
		async (event, data) => {
			if (!event.locals.account) {
				return {
					success: false,
					message: 'Not logged in'
				};
			}
			if (!event.locals.account.data.verified) {
				return {
					success: false,
					message: 'Account not verified'
				};
			}
			const res = await generateSummary(data.eventKey, data.year as 2024 | 2025);
			if (res.isErr()) {
				return {
					success: false,
					message: 'Failed to generate summary'
				};
			}
			return {
				success: true,
				data: res.value.serialize()
			};
		}
	);

	export const generateSummary = <Year extends 2024 | 2025>(eventKey: string, year: Year) => {
		return attemptAsync(async () => {
			const event = await Event.getEvent(eventKey, true).unwrap();
			const teams = await event.getTeams(true).unwrap();
			const matches = await event.getMatches(true).unwrap();
			const scouting = await Scouting.MatchScouting.fromProperty('eventKey', eventKey, {
				type: 'all'
			}).unwrap();

			const obj = teams.reduce(
				(acc, team) => {
					acc[team.tba.team_number] = [];
					return acc;
				},
				{} as Record<number, Trace[]>
			);

			for (const scout of scouting) {
				const team = scout.data.team;
				if (obj[team]) {
					const trace = Trace.parse(scout.data.trace).unwrap();
					obj[team].push(trace);
				}
			}

			if (year === 2024) {
				return Summary2024.computeAll(
					obj,
					matches.map((m) => m.tba)
				);
			} else if (year === 2025) {
				return Summary2025.computeAll(
					obj,
					matches.map((m) => m.tba)
				);
			}

			throw new Error('Invalid year');
		});
	};

	export const getSummary = <Year extends 2024 | 2025>(eventKey: string, year: Year) => {
		return attemptAsync(async () => {
			const res = await EventSummary.fromProperty('eventKey', eventKey, {
				type: 'single'
			}).unwrap();
			if (res) {
				if (year === 2024) {
					return Summary2024.deserialize(res.data.summary).unwrap();
				} else {
					return Summary2025.deserialize(res.data.summary).unwrap();
				}
			} else {
				const summary = await generateSummary(eventKey, year).unwrap();
				await EventSummary.new({
					eventKey,
					summary: summary.serialize()
				});
				return summary;
			}
		});
	};

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
		description: 'View FIRST team pictures and matches',
		features: []
	});

	Permissions.createEntitlement({
		name: 'upload-pictures',
		structs: [TeamPictures],
		group: 'FIRST',
		permissions: ['team_pictures:create'],
		description: 'Upload team pictures for FIRST events',
		features: []
	});
}

export const _firstTeamPicturesTable = FIRST.TeamPictures.table;
export const _firstMatchesTable = FIRST.Matches.table;
export const _firstCustomMatchesTable = FIRST.CustomMatches.table;
export const _firstEventSummaryTable = FIRST.EventSummary.table;
