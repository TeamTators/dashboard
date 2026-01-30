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
			eventKey: 'string',
			summary: 'string'
		},
		socket: sse,
		browser
	});

	const EventSummaryCache = new Table('event_summary', {
		eventKey: 'string',
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
			team: 'number',
			eventKey: 'string',
			picture: 'string',
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
			name: 'string',
			eventKey: 'string',
			number: 'number',
			compLevel: 'string',
			red1: 'number',
			red2: 'number',
			red3: 'number',
			red4: 'number',
			blue1: 'number',
			blue2: 'number',
			blue3: 'number',
			blue4: 'number'
		},
		socket: sse,
		browser
	});

	export type CustomMatchesData = StructData<typeof CustomMatches.data.structure>;
	export type CustomMatchesArr = DataArr<typeof CustomMatches.data.structure>;
}
