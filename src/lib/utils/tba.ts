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

export const get = <T>(url: string, parser: z.ZodType<T>) => {
	return Requests.get(url, {
		cache: true,
		expectStream: false,
		parser: parser
	});
};

const post = <T>(url: string, data: unknown, parser: z.ZodType<T>) => {
	return Requests.post(url, {
		cache: false,
		expectStream: false,
		body: data,
		parser,
	});
}

export class TBAEvent {
	private static _events = new Map<string, TBAEvent>();
	public static getEvents(year: number, force = false) {
		return attemptAsync(async () => {
			if (TBAEvent._events.size) return Array.from(TBAEvent._events.values());
			const events = (
				await get('/tba/events/' + year + `?force=${force}`, z.array(EventSchema))
			).unwrap();
			const e = events.map((e) => new TBAEvent(e));
			TBAEvent._events = new Map(e.map((e) => [e.tba.key, e]));
			return e;
		});
	}

	public static getEvent(eventKey: string, force = false) {
		return attemptAsync(async () => {
			const has = TBAEvent._events.get(eventKey);
			if (has) return has;
			const event = (await get('/tba/event/' + eventKey + `?force=${force}`, EventSchema)).unwrap();
			return new TBAEvent(event);
		});
	}

	public static createEvent(data: z.infer<typeof EventSchema>) {
		return post('/tba/event', data, z.object({
			success: z.boolean(),
			message: z.string(),
		}));
	}

	constructor(public readonly tba: E) {}

	private _matches: TBAMatch[] | null = null;

	getMatches(force = false) {
		return attemptAsync(async () => {
			if (this._matches) return this._matches;
			const matches = (
				await get('/tba/event/' + this.tba.key + `/matches?force=${force}`, z.array(MatchSchema))
			).unwrap();
			const m = matches.map((m) => new TBAMatch(m, this));
			this._matches = m;
			return m;
		});
	}

	private _teams: TBATeam[] | null = null;

	getTeams(force = false) {
		return attemptAsync(async () => {
			if (this._teams) return this._teams;
			const teams = (
				await get('/tba/event/' + this.tba.key + `/teams?force=${force}`, z.array(TeamSchema))
			).unwrap();
			const t = teams.map((t) => new TBATeam(t, this));
			this._teams = t;
			return t;
		});
	}

	update(data: z.infer<typeof EventSchema>) {
		return post('/tba/event/' + this.tba.key, data, z.object({
			success: z.boolean(),
			message: z.string(),
		}));
	}

	setTeams(teams: number[]) {
		return post('/tba/event/' + this.tba.key + '/teams', teams, z.object({
			success: z.boolean(),
			message: z.string(),
		}));
	}
}

export class TBAMatch {
	constructor(
		public readonly tba: M,
		public readonly event: TBAEvent
	) {}

	private _teams: [TBATeam, TBATeam, TBATeam, TBATeam, TBATeam, TBATeam] | null = null;

	getTeams(force = false) {
		return attemptAsync<[TBATeam, TBATeam, TBATeam, TBATeam, TBATeam, TBATeam]>(async () => {
			if (this._teams) return this._teams;
			const teams = (await this.event.getTeams(force)).unwrap();
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

	getMatches(force = false) {
		return attemptAsync(async () => {
			if (this._matches) return this._matches;
			const m = (await this.event.getMatches(force))
				.unwrap()
				.filter((m) => teamsFromMatch(m.tba).includes(this.tba.team_number));
			this._matches = m;
			return m;
		});
	}

	private _media: TBAMedia[] | null = null;

	getMedia(force = false) {
		return attemptAsync(async () => {
			if (this._media) return this._media;
			const res = await get(
				`/tba/event/${this.event.tba.key}/teams/${this.tba.team_number}/media?force=${force}`,
				z.array(MediaSchema)
			);
			this._media = res.unwrap();
			return this._media;
		});
	}

	private _status: TBATeamEventStatus | null = null;

	getStatus(force = false) {
		return attemptAsync(async () => {
			if (this._status) return this._status;
			const res = await get(
				`/tba/event/${this.event.tba.key}/teams/${this.tba.team_number}/status?force=${force}`,
				TeamEventStatusSchema
			);
			this._status = res.unwrap();
			return this._status;
		});
	}
}
