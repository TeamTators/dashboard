/**
 * @fileoverview Server-side FIRST Struct definitions and summary helpers.
 *
 * @description
 * Defines Drizzle-backed Structs for FIRST summaries, team pictures, and matches, and
 * provides summary generation and caching helpers.
 */
import { integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct';
import { Permissions } from './permissions';
import { attemptAsync } from 'ts-utils/check';
import Summary2024 from '../../utils/trace/summaries/2024';
import Summary2025 from '../../utils/trace/summaries/2025';
import { Event } from '../utils/tba';
import { Scouting } from './scouting';
import { Trace } from 'tatorscout/trace';
import { DataAction, PropertyAction } from '../../types/struct';
import structRegistry from '../services/struct-registry';
import { hash } from 'crypto';
import { Summary } from 'tatorscout/summary';

export namespace FIRST {
	export const EventSummary = new Struct({
		name: 'event_summary',
		structure: {
			/** TBA event key. */
			eventKey: text('event_key').notNull(),
			/** Serialized summary payload. */
			summary: text('summary').notNull(),
			/** Hash of the summary for cache invalidation. */
			summaryHash: text('summary_hash').notNull().default('') // to ensure we can invalidate the cache when the summary generation logic changes
		}
	});

	structRegistry
		.register(EventSummary)
		.block(DataAction.Archive)
		.block(DataAction.Clear)
		.block(DataAction.Create)
		.block(DataAction.Delete)
		.block(DataAction.DeleteVersion)
		.block(DataAction.RestoreArchive)
		.block(DataAction.RestoreVersion)
		.block(PropertyAction.Update)
		.block(PropertyAction.Read)
		.block(PropertyAction.ReadArchive)
		.block(PropertyAction.ReadVersionHistory)
		.block(PropertyAction.SetAttributes);

	export const generateSummary = <Year extends 2024 | 2025>(eventKey: string, year: Year) => {
		return attemptAsync(async () => {
			const event = await Event.getEvent(eventKey, true).unwrap();
			const teams = await event.getTeams(true).unwrap();
			const matches = await event.getMatches(true).unwrap();
			const scouting = await Scouting.MatchScouting.get(
				{ eventKey },
				{
					type: 'all'
				}
			).unwrap();

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

	export const hashSummary = (
		summary: Summary<
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			any,
			{
				[key: string]: {
					[key: string]: () => number;
				};
			}
		>
	) => {
		const normalizeFunction = (fn: (data: unknown) => number) => {
			return fn.toString().replace(/\s+/g, ' ').trim();
		};
		const canonical = Object.keys(summary['schema'])
			.sort()
			.map((outerKey) => {
				const inner = summary['schema'][outerKey];
				const innerCanonical = Object.keys(inner)
					.sort()
					.map((innerKey) => {
						const fn = inner[innerKey];
						return `${innerKey}:${normalizeFunction(fn)}`;
					})
					.join('|');

				return `${outerKey}:{${innerCanonical}}`;
			})
			.join('||');

		return hash('sha256', canonical);
	};

	export const getSummary = <Year extends 2024 | 2025>(eventKey: string, year: Year) => {
		return attemptAsync(async () => {
			const res = await EventSummary.get(
				{ eventKey: eventKey },
				{
					type: 'single'
				}
			).unwrap();
			if (res) {
				if (year === 2024) {
					const hash = hashSummary(Summary2024);
					if (res.data.summaryHash === hash) {
						return Summary2024.deserialize(res.data.summary).unwrap();
					}
				} else {
					const hash = hashSummary(Summary2025);
					if (res.data.summaryHash === hash) {
						return Summary2025.deserialize(res.data.summary).unwrap();
					}
				}
			}
			const summary = await generateSummary(eventKey, year).unwrap();
			await EventSummary.new({
				eventKey,
				summary: summary.serialize(),
				summaryHash: hashSummary(summary.parser)
			});
			return summary;
		});
	};

	export const TeamPictures = new Struct({
		name: 'team_pictures',
		structure: {
			/** Team number for the picture. */
			team: integer('team').notNull(),
			/** Event key associated with the picture. */
			eventKey: text('event_key').notNull(),
			/** Stored picture name or path. */
			picture: text('picture').notNull(),
			/** Account id that uploaded the picture. */
			accountId: text('account_id').notNull()
		}
	});

	// TeamPictures.on('delete', (pic) => {});

	export const Matches = new Struct({
		name: 'matches',
		structure: {
			/** Event key associated with the match. */
			eventKey: text('event_key').notNull(),
			/** Match number. */
			number: integer('number').notNull(),
			/** Competition level (qm, qf, sf, f). */
			compLevel: text('comp_level').notNull()
		}
	});

	export const CustomMatches = new Struct({
		name: 'custom_matches',
		structure: {
			/** Display name for the custom match. */
			name: text('name').notNull(),
			/** Event key associated with the match. */
			eventKey: text('event_key').notNull(),
			/** Match number. */
			number: integer('number').notNull(),
			/** Competition level (qm, qf, sf, f). */
			compLevel: text('comp_level').notNull(),
			/** Red alliance team 1 number. */
			red1: integer('red1').notNull(),
			/** Red alliance team 2 number. */
			red2: integer('red2').notNull(),
			/** Red alliance team 3 number. */
			red3: integer('red3').notNull(),
			/** Red alliance team 4 number. */
			red4: integer('red4').notNull(),
			/** Blue alliance team 1 number. */
			blue1: integer('blue1').notNull(),
			/** Blue alliance team 2 number. */
			blue2: integer('blue2').notNull(),
			/** Blue alliance team 3 number. */
			blue3: integer('blue3').notNull(),
			/** Blue alliance team 4 number. */
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
