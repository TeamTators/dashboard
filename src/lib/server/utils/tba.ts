import {
	EventSchema,
	MatchSchema,
	TeamSchema,
	type TBAEvent as E,
	type TBATeam as T,
	type TBAMatch as M,
	type TBATeamEventStatus,
	TeamEventStatusSchema,
	teamsFromMatch,
	MediaSchema,
	Match2025Schema,
	type TBAMatch2025
} from 'tatorscout/tba';
import { attempt, attemptAsync, type Result } from 'ts-utils/check';
import { TBA } from '../structs/TBA';
import { StructData } from 'drizzle-struct/back-end';
import { z } from 'zod';

export class Event {
	public static getEvents(year: number, force = false) {
		return attemptAsync<Event[]>(async () => {
			const custom = (
				await TBA.Events.fromProperty('year', year, {
					type: 'stream'
				}).await()
			).unwrap();

			const tba = (
				await TBA.get<E[]>(`/team/frc2122/events/${year}`, {
					updateThreshold: 1000 * 60 * 60 * 24,
					force
				})
			).unwrap();

			return [
				...custom.map((e) => new Event(EventSchema.parse(JSON.parse(e.data.data)), true, e)),
				...tba.map((e) => new Event(e, false))
			].sort((a, b) => new Date(a.tba.start_date).getTime() - new Date(b.tba.start_date).getTime());
		});
	}

	public static getEvent(eventKey: string, force = false) {
		return attemptAsync(async () => {
			const custom = (
				await TBA.Events.fromProperty('eventKey', eventKey, {
					type: 'single'
				})
			).unwrap();
			if (custom) return new Event(EventSchema.parse(JSON.parse(custom.data.data)), true, custom);

			const fromtba = (
				await TBA.get<E>(`/event/${eventKey}`, {
					updateThreshold: 1000 * 60 * 60 * 24,
					force
				})
			).unwrap();
			return new Event(fromtba, false);
		});
	}

	public static getTeamEvents(year: number, team: number, force = false) {
		return attemptAsync(async () => {
			const custom = (
				await TBA.Events.fromProperty('year', year, {
					type: 'stream'
				}).await()
			).unwrap();

			const tba = (
				await TBA.get<E[]>(`/team/frc${team}/events/${year}`, {
					updateThreshold: 1000 * 60 * 60 * 24,
					force
				})
			).unwrap();

			return [
				...custom.map((e) => new Event(EventSchema.parse(JSON.parse(e.data.data)), true, e)),
				...tba.map((e) => new Event(e, false))
			].sort((a, b) => new Date(a.tba.start_date).getTime() - new Date(b.tba.start_date).getTime());
		});
	}

	public static createEvent(event: {
		key: string;
		name: string;
		startDate: Date;
		endDate: Date;
		year: number;
	}) {
		return attemptAsync(async () => {
			const tbaObj: E = {
				key: event.key,
				name: event.name,
				start_date: event.startDate.toISOString(),
				end_date: event.endDate.toISOString(),
				year: event.year
			};

			return (
				await TBA.Events.new({
					year: event.year,
					eventKey: event.key,
					data: JSON.stringify(tbaObj)
				})
			).unwrap();
		});
	}

	constructor(
		public readonly tba: E,
		public readonly custom: boolean,
		public readonly data?: StructData<typeof TBA.Events.data.structure>
	) {}

	public getTeams(force = false) {
		return attemptAsync(async () => {
			if (this.custom) {
				return (
					await TBA.Teams.fromProperty('eventKey', this.tba.key, {
						type: 'stream'
					}).await()
				)
					.unwrap()
					.map((d) => TeamSchema.parse(JSON.parse(d.data.data)))
					.sort((a, b) => a.team_number - b.team_number)
					.map((d) => new Team(d, this));
			} else {
				return (
					await TBA.get<T[]>(`/event/${this.tba.key}/teams`, {
						updateThreshold: 1000 * 60 * 60 * 24,
						force
					})
				)
					.unwrap()
					.sort((a, b) => a.team_number - b.team_number)
					.map((t) => new Team(t, this));
			}
		});
	}

	public getMatches(force = false) {
		return attemptAsync(async () => {
			if (this.custom) {
				return (
					await TBA.Matches.fromProperty('eventKey', this.tba.key, {
						type: 'stream'
					}).await()
				)
					.unwrap()
					.map((m) => new Match(MatchSchema.parse(JSON.parse(m.data.data)), this))
					.sort((a, b) => {
						if (a.tba.comp_level === b.tba.comp_level)
							return a.tba.match_number - b.tba.match_number;
						const order = ['qm', 'qf', 'sf', 'f'];
						return order.indexOf(a.tba.comp_level) - order.indexOf(b.tba.comp_level);
					});
			} else {
				return (
					await TBA.get<M[]>(`/event/${this.tba.key}/matches`, {
						updateThreshold: 1000 * 60 * 10,
						force
					})
				)
					.unwrap()
					.map((t) => new Match(t, this))
					.sort((a, b) => {
						if (a.tba.comp_level === b.tba.comp_level)
							return a.tba.match_number - b.tba.match_number;
						const order = ['qm', 'qf', 'sf', 'f'];
						return order.indexOf(a.tba.comp_level) - order.indexOf(b.tba.comp_level);
					});
			}
		});
	}

	delete() {
		return attemptAsync(async () => {
			if (this.data) {
				// const [matches, teams] = await Promise.all([this.getMatches(), this.getTeams()]);
				// resolveAll(await Promise.all([
				//     ...matches.unwrap(),
				//     ...teams.unwrap(),
				// ].map(e => e.delete()))).unwrap();
				(await this.data.delete()).unwrap();
			} else throw new Error('Cannot delete a non-custom event');
		});
	}
}

export class Match {
	constructor(
		public readonly tba: M,
		public readonly event: Event,
		public readonly data?: StructData<typeof TBA.Matches.data.structure>
	) {
		if (tba.comp_level === 'sf') tba.match_number = tba.set_number;
	}

	get custom() {
		return this.event.custom;
	}

	public getTeams() {
		return attemptAsync(async () => {
			const teams = teamsFromMatch(this.tba);
			return (await this.event.getTeams())
				.unwrap()
				.filter((t) => teams.includes(t.tba.team_number));
		});
	}

	get teams(): [number, number, number, number, number, number] {
		const { red, blue } = this.tba.alliances;
		return [
			red.team_keys[0],
			red.team_keys[1],
			red.team_keys[2],
			blue.team_keys[0],
			blue.team_keys[1],
			blue.team_keys[2]
		].map((key) => {
			const match = key.match(/\d+/);
			if (!match) throw new Error(`Invalid team key: ${key}`);
			return parseInt(match[0]);
		}) as [number, number, number, number, number, number];
	}

	// delete() {
	//     return attemptAsync(async () => {
	//         if (this.data) {
	//             (await this.data.delete()).unwrap();
	//         }
	//     });
	// }

	asYear<Y extends 2025>(year: Y): Result<Y extends 2025 ? TBAMatch2025 : never> {
		return attempt(() => {
			if (year === 2025) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return Match2025Schema.parse(this.tba) as any;
			} else throw new Error('Invalid year');
		});
	}
}

export class Team {
	public static getTeam(number: number, force = false) {
		return attemptAsync(async () => {
			const tba = (
				await TBA.get<T>(`/team/frc${number}`, {
					updateThreshold: 1000 * 60 * 60 * 24,
					force
				})
			).unwrap();
			return tba;
		});
	}

	constructor(
		public readonly tba: T,
		public readonly event: Event,
		public readonly data?: StructData<typeof TBA.Teams.data.structure>
	) {}

	get custom() {
		return this.event.custom;
	}

	public getMatches() {
		return attemptAsync(async () => {
			return (await this.event.getMatches())
				.unwrap()
				.filter((m) => teamsFromMatch(m.tba).includes(this.tba.team_number));
		});
	}

	public getMedia() {
		return attemptAsync(async () => {
			if (this.custom) return [];
			const res = await TBA.get(`/team/${this.tba.key}/media/${this.event.tba.year}`, {
				timeout: 1000 * 60,
				updateThreshold: 1000 * 60 * 60
			});

			return z.array(MediaSchema).parse(res.unwrap());
		});
	}

	public getStatus() {
		return attemptAsync(async () => {
			if (this.custom) return null;
			const res = await TBA.get(`/team/${this.tba.key}/event/${this.event.tba.key}/status`, {
				timeout: 1000 * 60,
				updateThreshold: 1000 * 60 * 10
			});

			return TeamEventStatusSchema.parse(res.unwrap());
		});
	}

	// delete() {
	//     return attemptAsync(async () => {
	//         if (this.data) {
	//             (await this.data.delete()).unwrap();
	//         }
	//     });
	// }
}
