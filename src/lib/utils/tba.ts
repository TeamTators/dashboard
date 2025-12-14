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

export const get = <T>(url: string, force: boolean, parser: z.ZodType<T>, expires: Date) => {
	return attemptAsync<T>(async () => {
		let cached: T | null = null;
		if (!force) {
			console.log('Checking TBA cache for', url);
			const res = await TBARequestCache.fromProperty('url', url, {
				pagination: false
			}).unwrap();
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

const post = <T>(url: string, data: unknown, parser: z.ZodType<T>) => {
	return Requests.post(url, {
		cache: false,
		expectStream: false,
		body: data,
		parser
	});
};

export class TBAEvent {
	private static _events = new Map<string, TBAEvent>();
	public static getEvents(year: number, force: boolean, expires: Date) {
		return attemptAsync(async () => {
			if (TBAEvent._events.size) return Array.from(TBAEvent._events.values());
			const events = (
				await get('/tba/events/' + year, force, z.array(EventSchema), expires)
			).unwrap();
			const e = events.map((e) => new TBAEvent(e));
			TBAEvent._events = new Map(e.map((e) => [e.tba.key, e]));
			return e;
		});
	}

	public static getEvent(eventKey: string, force: boolean, expires: Date) {
		return attemptAsync(async () => {
			const has = TBAEvent._events.get(eventKey);
			if (has) return has;
			const event = (
				await get('/tba/event/' + eventKey + '/simple', force, EventSchema, expires)
			).unwrap();
			return new TBAEvent(event);
		});
	}

	public static createEvent(data: z.infer<typeof EventSchema>) {
		return post(
			'/tba/event',
			data,
			z.object({
				success: z.boolean(),
				message: z.string()
			})
		);
	}

	constructor(public readonly tba: E) {}

	private _matches: TBAMatch[] | null = null;

	getMatches(force: boolean, expires: Date) {
		return attemptAsync(async () => {
			if (this._matches) return this._matches;
			const matches = (
				await get(
					'/tba/event/' + this.tba.key + `/matches/simple`,
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

	getTeams(force: boolean, expires: Date) {
		return attemptAsync(async () => {
			if (this._teams) return this._teams;
			const teams = (
				await get(
					'/tba/event/' + this.tba.key + `/teams/simple`,
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

	update(data: z.infer<typeof EventSchema>) {
		return post(
			'/tba/event/' + this.tba.key + '/simple',
			data,
			z.object({
				success: z.boolean(),
				message: z.string()
			})
		);
	}

	setTeams(teams: z.infer<typeof TeamSchema>[]) {
		return post(
			'/tba/event/' + this.tba.key + '/teams/simple',
			teams,
			z.object({
				success: z.boolean(),
				message: z.string()
			})
		);
	}

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
			'/tba/event/' + this.tba.key + '/matches/simple',
			matches,
			z.object({
				success: z.boolean(),
				message: z.string()
			})
		);
	}
}

export class TBAMatch {
	constructor(
		public readonly tba: M,
		public readonly event: TBAEvent
	) {}

	private _teams: [TBATeam, TBATeam, TBATeam, TBATeam, TBATeam, TBATeam] | null = null;

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

	asYear<Y extends 2025>(year: Y): Result<Y extends 2025 ? TBAMatch2025 : never> {
		return attempt(() => {
			if (year === 2025) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return Match2025Schema.parse(this.tba) as any;
			} else throw new Error('Invalid year');
		});
	}

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
	constructor(
		public readonly tba: T,
		public readonly event: TBAEvent
	) {}

	private _matches: TBAMatch[] | null = null;

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

	getMedia(force: boolean, expires: Date) {
		return attemptAsync(async () => {
			if (this._media) return this._media;
			const res = await get(
				`/tba/event/${this.event.tba.key}/teams/${this.tba.team_number}/media`,
				force,
				z.array(MediaSchema),
				expires
			);
			this._media = res.unwrap();
			return this._media;
		});
	}

	private _status: TBATeamEventStatus | null = null;

	getStatus(force: boolean, expires: Date) {
		return attemptAsync(async () => {
			if (this._status) return this._status;
			const res = await get(
				`/tba/event/${this.event.tba.key}/teams/${this.tba.team_number}/status`,
				force,
				TeamEventStatusSchema,
				expires
			);
			this._status = res.unwrap();
			return this._status;
		});
	}
}
