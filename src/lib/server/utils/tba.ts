/**
 * @fileoverview Server-side TBA utilities and wrappers.
 *
 * @description
 * Provides classes to fetch and manage TBA events, matches, and teams, with optional
 * support for custom cached data.
 */
import {
	EventSchema,
	MatchSchema,
	TeamSchema,
	type TBAEvent as E,
	type TBATeam as T,
	type TBAMatch as M,
	TeamEventStatusSchema,
	teamsFromMatch,
	MediaSchema,
	Match2025Schema,
	type TBAMatch2025,
	type TBAMatch
} from 'tatorscout/tba';
import { attempt, attemptAsync, resolveAll, type Result } from 'ts-utils/check';
import { TBA } from '../structs/TBA';
import { StructData } from 'drizzle-struct';
import { z } from 'zod';

export class Event {
	/**
	 * Fetch events for the given year.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing events.
	 */
	public static getEvents(year: number, force = false) {
		return attemptAsync<Event[]>(async () => {
			const custom = await TBA.Events.get(
				{ year: year },
				{
					type: 'all'
				}
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

	/**
	 * Fetch a single event by key.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing the event.
	 */
	public static getEvent(eventKey: string, force = false) {
		return attemptAsync(async () => {
			const custom = (
				await TBA.Events.get(
					{ eventKey: eventKey },
					{
						type: 'single'
					}
				)
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

	/**
	 * Fetch events for a team in the given year.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing events.
	 */
	public static getTeamEvents(year: number, team: number, force = false) {
		return attemptAsync(async () => {
			const custom = await TBA.Events.get(
				{ year: year },
				{
					type: 'all'
				}
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

	/**
	 * Create a custom event and persist it to the cache.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing the created record.
	 */
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

	/**
	 * Fetch teams for this event.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing teams.
	 */
	public getTeams(force = false) {
		return attemptAsync(async () => {
			if (this.custom) {
				return (
					await TBA.Teams.get(
						{ eventKey: this.tba.key },
						{
							type: 'all'
						}
					)
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

	/**
	 * Fetch matches for this event.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing matches.
	 */
	public getMatches(force = false) {
		return attemptAsync(async () => {
			if (this.custom) {
				return (
					await TBA.Matches.get(
						{ eventKey: this.tba.key },
						{
							type: 'all'
						}
					)
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

	/**
	 * Fetch matches and validate them against a schema.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing matches.
	 */
	public getMatchesFromSchema(matchSchema: z.ZodSchema, force = false) {
		return attemptAsync(async () => {
			if (this.custom) {
				return (
					await TBA.Matches.get(
						{ eventKey: this.tba.key },
						{
							type: 'all'
						}
					)
				)
					.unwrap()
					.map((m) => new Match(matchSchema.parse(JSON.parse(m.data.data)), this))
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

	/**
	 * Delete a custom event and its cached data.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the deletion.
	 */
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

	/**
	 * Update a custom event definition.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the update.
	 */
	update(data: { name: string; startDate: Date; endDate: Date; year: number }) {
		return attemptAsync(async () => {
			if (!this.custom) throw new Error('Cannot update a non-custom event');
			if (this.custom && this.data) {
				const tbaObj: E = {
					...this.tba,
					name: data.name,
					start_date: data.startDate.toISOString(),
					end_date: data.endDate.toISOString(),
					year: data.year
				};

				return (
					await this.data.update({
						data: JSON.stringify(tbaObj)
					})
				).unwrap();
			} else {
				throw new Error('Cannot update a non-custom event');
			}
		});
	}

	/**
	 * Replace the teams list for a custom event.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the update.
	 */
	setTeams(teams: z.infer<typeof TeamSchema>[]) {
		return attemptAsync(async () => {
			if (!this.custom) throw new Error('Cannot set teams for a non-custom event');

			teams = teams
				.sort((a, b) => a.team_number - b.team_number)
				.filter((t, i, a) => a.findIndex((tt) => tt.team_number === t.team_number) === i);

			const currentTeams = await TBA.Teams.get(
				{ eventKey: this.tba.key },
				{
					type: 'all'
				}
			).unwrap();

			await Promise.all(currentTeams.map((c) => c.delete().unwrap()));

			await Promise.all(
				teams.map((t) =>
					TBA.Teams.new({
						eventKey: this.tba.key,
						teamKey: `frc${t.team_number}`,
						data: JSON.stringify(t)
					})
				)
			);
		});
	}

	/**
	 * Replace the matches list for a custom event.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper for the update.
	 */
	setMatches(matches: TBAMatch[]) {
		return attemptAsync(async () => {
			if (!this.custom) throw new Error('Cannot set matches for a non-custom event');

			await TBA.Matches.get(
				{ eventKey: this.tba.key },
				{
					type: 'stream'
				}
			).pipe((c) => c.delete().unwrap());

			resolveAll(
				await Promise.all(
					matches.map((m) =>
						TBA.Matches.new({
							eventKey: this.tba.key,
							matchKey: m.key,
							data: JSON.stringify(m)
						})
					)
				)
			).unwrap();
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

	/**
	 * Fetch teams participating in this match.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing teams.
	 */
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

	/**
	 * Parse this match using a year-specific schema.
	 *
	 * @returns {ReturnType<typeof attempt>} Result wrapper containing the parsed match.
	 */
	asYear<Y extends 2025>(year: Y): Result<Y extends 2025 ? TBAMatch2025 : never> {
		return attempt(() => {
			if (year === 2025) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return Match2025Schema.parse(this.tba) as any;
			} else throw new Error('Invalid year');
		});
	}

	toString() {
		const compLevelMap: Record<string, string> = {
			qm: 'Qualifications',
			qf: 'Quarterfinals',
			sf: 'Semifinals',
			f: 'Finals'
		};
		const compLevel = compLevelMap[this.tba.comp_level] || this.tba.comp_level;
		return `${compLevel} Match ${this.tba.match_number}`;
	}
}

export class Team {
	/**
	 * Fetch a team directly from TBA.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing the team.
	 */
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

	/**
	 * Fetch matches for this team within the event.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing matches.
	 */
	public getMatches() {
		return attemptAsync(async () => {
			return (await this.event.getMatches())
				.unwrap()
				.filter((m) => teamsFromMatch(m.tba).includes(this.tba.team_number));
		});
	}

	/**
	 * Fetch media items for this team at the event.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing media items.
	 */
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

	/**
	 * Fetch the event status for this team.
	 *
	 * @returns {ReturnType<typeof attemptAsync>} Result wrapper containing status.
	 */
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
