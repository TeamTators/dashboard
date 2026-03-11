/**
 * @fileoverview Client-side helpers for TBA requests, caching, and model wrappers.
 * @description
 * Provides cached fetch helpers and lightweight model classes for events, matches, and teams.
 */

import { attempt, attemptAsync, type Result } from 'ts-utils/check';
import { Requests } from './requests';
import {
	EventSchema,
	MatchSchema,
	TeamSchema,
	type TBAEvent as E,
	type TBAMatch as M,
	type TBATeam as T,
	teamsFromMatch,
	type TBAMedia,
	MediaSchema,
	type TBATeamEventStatus,
	TeamEventStatusSchema,
	Match2025Schema,
	type TBAMatch2025
} from 'tatorscout/tba';
import { z } from 'zod';
import { Table } from '$lib/services/db/table';
import { Loop } from 'ts-utils/loop';
import { browser } from '$app/environment';

const TBARequestCache = new Table('tba_request_cache', {
	url: 'string',
	response: 'string',
	expires: 'date'
});

if (browser) {
	new Loop(async () => {
		const now = new Date(new Date().getTime() + 1000 * 60 * 60 * 24);
		const data = await TBARequestCache.table().where('expires').below(now).toArray();
		if (data.length) console.log('Deleting', data.length, 'expired TBA cache entries');

		for (const item of data) TBARequestCache.Generator(item).delete();
	}, 1000 * 60).start(); // Clean up expired cache entries every minute
}

/**
 * Fetches data from the TBA proxy endpoint with optional caching.
 * @param url - API endpoint path to request.
 * @param force - Whether to bypass cache lookups.
 * @param parser - Zod parser for response validation.
 * @param expires - Cache expiration timestamp to store on success.
 * @returns A Result that resolves to parsed data or an error.
 */
export const get = <T>(url: string, force: boolean, parser: z.ZodType<T>, expires: Date) => {
	return attemptAsync<T>(async () => {
		let cached: T | null = null;
		if (!force) {
			const res = await TBARequestCache.get(
				{ url },
				{
					pagination: false
				}
			).unwrap();
			const [cache] = res.data;
			if (cache) {
				const parsed = parser.safeParse(JSON.parse(cache.data.response));
				if (parsed.success) {
					cached = parsed.data;
				} else {
					console.warn('TBA Cache parse error:', parsed.error);
					cache.delete();
				}
				if (cache.data.expires > new Date() && cached !== null) {
					return cached;
				}
			}
		}

		const res = await Requests.get(url + `?force=${force}`, {
			cache: true,
			expectStream: false,
			parser: parser
		});

		if (res.isErr() && cached !== null) {
			return cached;
		}

		if (res.isErr() && cached === null) {
			throw res.error;
		}

		if (res.isOk()) {
			if (!force) {
				await TBARequestCache.new({
					url,
					response: JSON.stringify(res.value),
					expires
				});
			}

			return res.value;
		}
		throw new Error('Unreachable');
	});
};

/**
 * Sends data to the TBA proxy endpoint.
 * @param url - API endpoint path to post to.
 * @param data - Payload to send.
 * @param parser - Zod parser for response validation.
 * @returns A Result containing the parsed response.
 */
const post = <T>(url: string, data: unknown, parser: z.ZodType<T>) => {
	return Requests.post(url, {
		cache: false,
		expectStream: false,
		body: data,
		parser
	});
};

/**
 * Wrapper for TBA event data with cached match and team collections.
 */
export class TBAEvent {
	private static _events = new Map<string, TBAEvent>();

	/**
	 * Retrieves and caches events for a season.
	 * @param year - Season year to fetch.
	 * @param force - Whether to bypass cache lookups.
	 * @param expires - Cache expiration timestamp to store on success.
	 * @returns A Result with the season events.
	 */
	public static getEvents(year: number, force: boolean, expires: Date) {
		return attemptAsync(async () => {
			if (TBAEvent._events.size) return Array.from(TBAEvent._events.values());
			const events = (
				await get('/api/tba/events/' + year, force, z.array(EventSchema), expires)
			).unwrap();
			const e = events.map((e) => new TBAEvent(e));
			TBAEvent._events = new Map(e.map((e) => [e.tba.key, e]));
			return e;
		});
	}

	/**
	 * Fetches a single event by key, using cached events when available.
	 * @param eventKey - Event key to fetch.
	 * @param force - Whether to bypass cache lookups.
	 * @param expires - Cache expiration timestamp to store on success.
	 * @returns A Result with the requested event.
	 */
	public static getEvent(eventKey: string, force: boolean, expires: Date) {
		return attemptAsync(async () => {
			const has = TBAEvent._events.get(eventKey);
			if (has) return has;
			const event = (
				await get('/api/tba/event/' + eventKey + '/simple', force, EventSchema, expires)
			).unwrap();
			return new TBAEvent(event);
		});
	}

	/**
	 * Persists a custom event record through the proxy API.
	 * @param data - Event data to create.
	 * @returns A Result indicating success or failure.
	 */
	public static createEvent(data: z.infer<typeof EventSchema>) {
		return post(
			'/api/tba/event',
			data,
			z.object({
				success: z.boolean(),
				message: z.string()
			})
		);
	}

	/**
	 * Creates a wrapper around raw TBA event data.
	 * @param tba - Raw event payload from the TBA API.
	 */
	constructor(public readonly tba: E) {}

	private _matches: TBAMatch[] | null = null;

	/**
	 * Loads and caches match data for the event.
	 * @param force - Whether to bypass cache lookups.
	 * @param expires - Cache expiration timestamp to store on success.
	 * @returns A Result with event matches.
	 */
	getMatches(force: boolean, expires: Date) {
		return attemptAsync(async () => {
			if (this._matches) return this._matches;
			const matches = (
				await get(
					'/api/tba/event/' + this.tba.key + `/matches/simple`,
					force,
					z.array(MatchSchema),
					expires
				)
			).unwrap();
			const m = matches.map((m) => new TBAMatch(m, this));
			this._matches = m;
			return m;
		});
	}

	private _teams: TBATeam[] | null = null;

	/**
	 * Loads and caches team data for the event.
	 * @param force - Whether to bypass cache lookups.
	 * @param expires - Cache expiration timestamp to store on success.
	 * @returns A Result with event teams.
	 */
	getTeams(force: boolean, expires: Date) {
		return attemptAsync(async () => {
			if (this._teams) return this._teams;
			const teams = (
				await get(
					'/api/tba/event/' + this.tba.key + `/teams/simple`,
					force,
					z.array(TeamSchema),
					expires
				)
			).unwrap();
			const t = teams.map((t) => new TBATeam(t, this));
			this._teams = t;
			return t;
		});
	}

	/**
	 * Updates this event's basic metadata.
	 * @param data - Updated event data payload.
	 * @returns A Result indicating success or failure.
	 */
	update(data: z.infer<typeof EventSchema>) {
		return post(
			'/api/tba/event/' + this.tba.key + '/simple',
			data,
			z.object({
				success: z.boolean(),
				message: z.string()
			})
		);
	}

	/**
	 * Replaces the event's team list.
	 * @param teams - Teams to set for this event.
	 * @returns A Result indicating success or failure.
	 */
	setTeams(teams: z.infer<typeof TeamSchema>[]) {
		return post(
			'/api/tba/event/' + this.tba.key + '/teams/simple',
			teams,
			z.object({
				success: z.boolean(),
				message: z.string()
			})
		);
	}

	/**
	 * Replaces the event's match list.
	 * @param matches - Simplified match payloads to store.
	 * @returns A Result indicating success or failure.
	 */
	setMatches(
		matches: {
			number: number;
			compLevel: 'qm' | 'qf' | 'sf' | 'f';
			red: [number, number, number];
			blue: [number, number, number];
			time: number;
		}[]
	) {
		return post(
			'/api/tba/event/' + this.tba.key + '/matches/simple',
			matches,
			z.object({
				success: z.boolean(),
				message: z.string()
			})
		);
	}
}

export class TBAMatch {
	/**
	 * Creates a wrapper around a raw TBA match.
	 * @param tba - Raw match payload.
	 * @param event - Parent event wrapper.
	 */
	constructor(
		public readonly tba: M,
		public readonly event: TBAEvent
	) {}

	private _teams: [TBATeam, TBATeam, TBATeam, TBATeam, TBATeam, TBATeam] | null = null;

	/**
	 * Resolves the match teams as `TBATeam` wrappers.
	 * @param force - Whether to bypass cache lookups.
	 * @param expires - Cache expiration timestamp to store on success.
	 * @returns A Result containing the six teams in match order.
	 */
	getTeams(force: boolean, expires: Date) {
		return attemptAsync<[TBATeam, TBATeam, TBATeam, TBATeam, TBATeam, TBATeam]>(async () => {
			if (this._teams) return this._teams;
			const teams = (await this.event.getTeams(force, expires)).unwrap();
			const fromMatch = teamsFromMatch(this.tba);

			this._teams = fromMatch.map((num) => {
				const t = teams.find((t) => t.tba.team_number === num);
				if (!t) throw new Error('Team not found');
				return t;
			}) as [TBATeam, TBATeam, TBATeam, TBATeam, TBATeam, TBATeam];
			return this._teams;
		});
	}

	/**
	 * Parses this match into a year-specific schema.
	 * @param year - Year schema to parse against.
	 * @returns A Result containing the typed match data.
	 */
	asYear<Y extends 2025>(year: Y): Result<Y extends 2025 ? TBAMatch2025 : never> {
		return attempt(() => {
			if (year === 2025) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return Match2025Schema.parse(this.tba) as any;
			} else throw new Error('Invalid year');
		});
	}

	/**
	 * Formats the match into a human-readable label.
	 * @returns A display string for this match.
	 */
	toString() {
		switch (this.tba.comp_level) {
			case 'qm':
				return `Qualifications ${this.tba.match_number}`;
			case 'qf':
				return `Quarterfinals ${this.tba.match_number}`;
			case 'sf':
				return `Semifinals ${this.tba.match_number}`;
			case 'f':
				return `Finals ${this.tba.match_number}`;
			case 'tiebreaker':
				return `Tiebreaker ${this.tba.match_number}`;
			default:
				return `${this.tba.match_number}`;
		}
	}
}

export class TBATeam {
	/**
	 * Creates a wrapper around a raw TBA team.
	 * @param tba - Raw team payload.
	 * @param event - Parent event wrapper.
	 */
	constructor(
		public readonly tba: T,
		public readonly event: TBAEvent
	) {}

	private _matches: TBAMatch[] | null = null;

	/**
	 * Loads and caches matches involving this team.
	 * @param force - Whether to bypass cache lookups.
	 * @param expires - Cache expiration timestamp to store on success.
	 * @returns A Result with the team's matches for the event.
	 */
	getMatches(force: boolean, expires: Date) {
		return attemptAsync(async () => {
			if (this._matches) return this._matches;
			const m = (await this.event.getMatches(force, expires))
				.unwrap()
				.filter((m) => teamsFromMatch(m.tba).includes(this.tba.team_number));
			this._matches = m;
			return m;
		});
	}

	private _media: TBAMedia[] | null = null;

	/**
	 * Loads and caches media entries for this team at the event.
	 * @param force - Whether to bypass cache lookups.
	 * @param expires - Cache expiration timestamp to store on success.
	 * @returns A Result containing the team's media list.
	 */
	getMedia(force: boolean, expires: Date) {
		return attemptAsync(async () => {
			if (this._media) return this._media;
			const res = await get(
				`/api/tba/event/${this.event.tba.key}/teams/${this.tba.team_number}/media`,
				force,
				z.array(MediaSchema),
				expires
			);
			this._media = res.unwrap();
			return this._media;
		});
	}

	private _status: TBATeamEventStatus | null = null;

	/**
	 * Loads and caches event status for this team.
	 * @param force - Whether to bypass cache lookups.
	 * @param expires - Cache expiration timestamp to store on success.
	 * @returns A Result containing the team's event status.
	 */
	getStatus(force: boolean, expires: Date) {
		return attemptAsync(async () => {
			if (this._status) return this._status;
			const res = await get(
				`/api/tba/event/${this.event.tba.key}/teams/${this.tba.team_number}/status`,
				force,
				TeamEventStatusSchema,
				expires
			);
			this._status = res.unwrap();
			return this._status;
		});
	}
}
