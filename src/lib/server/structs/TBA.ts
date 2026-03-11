/**
 * @fileoverview Server-side TBA cache structs and fetch helpers.
 *
 * @description
 * Defines Drizzle-backed Structs for TBA caching and a helper to fetch/update cached data.
 */
import { integer } from 'drizzle-orm/pg-core';
import { text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct';
import { attemptAsync, resolveAll, type Result } from 'ts-utils/check';
import { Permissions } from './permissions';
import { str } from '../utils/env';

const TBA_KEY = str('TBA_KEY', true);

export namespace TBA {
	const BASE_URL = 'https://www.thebluealliance.com/api/v3';

	export const Requests = new Struct({
		name: 'tba_requests',
		structure: {
			/** Request URL used as a cache key. */
			url: text('url').notNull().unique(),
			/** Cached response payload. */
			response: text('response').notNull()
		}
	});

	export const Events = new Struct({
		name: 'tba_custom_events',
		structure: {
			/** Competition year. */
			year: integer('year').notNull(),
			/** Event key. */
			eventKey: text('event_key').notNull(),
			/** Serialized event object. */
			data: text('data').notNull() // JSON Event Object
		}
	});

	Events.on('delete', async (e) => {
		const [teams, matches] = await Promise.all([
			Teams.get({ eventKey: e.data.eventKey }, { type: 'array', limit: 1000, offset: 0 }),
			Matches.get({ eventKey: e.data.eventKey }, { type: 'array', limit: 1000, offset: 0 })
		]);

		const res = resolveAll(
			await Promise.all([
				...teams.unwrap().map((t) => t.delete()),
				...matches.unwrap().map((m) => m.delete())
			])
		);
		if (res.isErr()) console.error(res.error);
	});

	export const Teams = new Struct({
		name: 'tba_custom_teams',
		structure: {
			/** Event key to scope the team. */
			eventKey: text('event_key').notNull(),
			/** Team key (frcXXXX). */
			teamKey: text('team_key').notNull(), // frcXXXX
			/** Serialized team object. */
			data: text('data').notNull() // JSON Team Object
		}
	});

	export const Matches = new Struct({
		name: 'tba_custom_matches',
		structure: {
			/** Event key to scope the match. */
			eventKey: text('event_key').notNull(),
			/** Match key (e.g., 2020casj_qf1m1). */
			matchKey: text('match_key').notNull(), // 2020casj_qf1m1
			/** Serialized match object. */
			data: text('data').notNull() // JSON Match Object
		}
	});

	type RequestConfig = {
		timeout?: number;
		updateThreshold: number;
		force?: boolean;
	};

	/**
	 * Fetch from TBA or cached responses based on update thresholds.
	 *
	 * @returns {Promise<Result<T>>} Result wrapper containing the parsed response.
	 */
	export const get = <T>(path: string, config: RequestConfig): Promise<Result<T>> => {
		return attemptAsync(async () => {
			if (!path.startsWith('/')) path = '/' + path;

			const exists = await Requests.get(
				{ url: path },
				{
					type: 'single'
				}
			);

			if (exists.isOk() && exists.value && !config.force) {
				const between = Date.now() - exists.value.updated.getTime();
				if (between < config.updateThreshold) {
					return JSON.parse(exists.value.data.response) as T;
				} else {
					(await exists.value.delete()).unwrap(); // remove duplicates
				}
			}

			return new Promise<T>((res, rej) => {
				const t = setTimeout(
					() => {
						rej();
					},
					config?.timeout ?? 1000 * 10
				);

				fetch(`${BASE_URL}${path}`, {
					method: 'GET',
					headers: {
						'X-TBA-Auth-Key': TBA_KEY || 'tba_key',
						Accept: 'application/json'
					}
				})
					.then((r) => r.json())
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.then((json: any) => {
						if (json.Error) return rej(json.Error);
						clearTimeout(t);
						res(json as T);

						if (config.updateThreshold > 0) {
							Requests.new({
								url: path,
								response: JSON.stringify(json)
							});
						}
					})
					.catch(rej);
			});
		});
	};

	Permissions.createEntitlement({
		name: 'create-custom-tba-responses',
		structs: [Requests],
		permissions: ['*'],
		group: 'TBA',
		description: 'Create custom TBA responses',
		features: []
	});
	// Blank because it needs to be called customly
	Permissions.createEntitlement({
		name: 'manage-tba',
		structs: [],
		permissions: [],
		group: 'TBA',
		description: 'Manage TBA data',
		features: []
	});
}

export const _tbaRequestsTable = TBA.Requests.table;
export const _tbaEventsTable = TBA.Events.table;
export const _tbaTeamsTable = TBA.Teams.table;
export const _tbaMatchesTable = TBA.Matches.table;
