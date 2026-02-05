/**
 * @fileoverview FIRST-related Struct models and helpers.
 *
 * @description
 * Defines client-side Structs for event summaries, team pictures, and custom matches,
 * plus a helper to fetch and cache event summaries.
 */
import { sse } from '../services/sse';
import { type DataArr } from '$lib/services/struct/data-arr';
import { Struct } from '$lib/services/struct';
import { StructData } from '$lib/services/struct';
import { browser } from '$app/environment';
import { Table } from '$lib/services/db/table';
import { attemptAsync } from 'ts-utils';
import Summary2025 from '../utils/trace/summaries/2025';
import Summary2024 from '../utils/trace/summaries/2024';
import { z } from 'zod';
import * as remote from '$lib/remotes/FIRST.remote';

export namespace FIRST {
	export const EventSummary = new Struct({
		name: 'event_summary',
		structure: {
			/** TBA event key (e.g., "2025miket"). */
			eventKey: 'string',
			/** Serialized summary payload. */
			summary: 'string'
		},
		socket: sse,
		browser
	});

	const EventSummaryCache = new Table('event_summary', {
		/** TBA event key used for cache lookup. */
		eventKey: 'string',
		/** Cached serialized summary payload. */
		summary: 'string'
	});

	export const getSummary = <Year extends 2024 | 2025>(
		eventKey: string,
		year: Year,
		config: {
			cacheExpires: Date;
		}
	) => {
		return attemptAsync<
			ReturnType<
				ReturnType<
					(Year extends 2024 ? typeof Summary2024 : typeof Summary2025)['deserialize']
				>['unwrap']
			>
		>(async () => {
			const get = async () => {
				const { data } = await remote.getSummary({ eventKey });

				await EventSummaryCache.new({
					eventKey,
					summary: data
				}).unwrap();

				if (year === 2024) {
					return Summary2024.deserialize(data).unwrap();
				}
				if (year === 2025) {
					return Summary2025.deserialize(data).unwrap();
				}
				throw new Error('Invalid year');
			};

			const res = await EventSummaryCache.get(
				{ eventKey: eventKey },
				{
					pagination: false
				}
			).unwrap();
			const obj = res.data[0];
			if (!obj) return get();
			if (obj.data.created_at > config.cacheExpires) {
				await obj.delete().unwrap();
				return get();
			}
			const summary = obj.data.summary;
			if (!summary) throw new Error('No summary found');
			if (year === 2024) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return Summary2024.deserialize(summary).unwrap() as any;
			}
			if (year === 2025) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return Summary2025.deserialize(summary).unwrap() as any;
			}
			return get();
		});
	};

	export const TeamPictures = new Struct({
		name: 'team_pictures',
		structure: {
			/** Team number for the picture. */
			team: 'number',
			/** Event key that the picture is associated with. */
			eventKey: 'string',
			/** File name or storage key for the picture. */
			picture: 'string',
			/** Account id that uploaded the picture. */
			accountId: 'string'
		},
		socket: sse,
		browser
	});

	export type TeamPicturesData = StructData<typeof TeamPictures.data.structure>;
	export type TeamPicturesArr = DataArr<typeof TeamPictures.data.structure>;

	export const CustomMatches = new Struct({
		name: 'custom_matches',
		structure: {
			/** Display name for the custom match. */
			name: 'string',
			/** Event key the match belongs to. */
			eventKey: 'string',
			/** Match number. */
			number: 'number',
			/** Competition level (e.g., qm, qf, sf, f). */
			compLevel: 'string',
			/** Red alliance team 1 number. */
			red1: 'number',
			/** Red alliance team 2 number. */
			red2: 'number',
			/** Red alliance team 3 number. */
			red3: 'number',
			/** Red alliance team 4 number (if applicable). */
			red4: 'number',
			/** Blue alliance team 1 number. */
			blue1: 'number',
			/** Blue alliance team 2 number. */
			blue2: 'number',
			/** Blue alliance team 3 number. */
			blue3: 'number',
			/** Blue alliance team 4 number (if applicable). */
			blue4: 'number'
		},
		socket: sse,
		browser
	});

	export type CustomMatchesData = StructData<typeof CustomMatches.data.structure>;
	export type CustomMatchesArr = DataArr<typeof CustomMatches.data.structure>;
}
