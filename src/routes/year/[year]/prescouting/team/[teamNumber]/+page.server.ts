import { Scouting } from '$lib/server/structs/scouting.js';
import { Event, Team } from '$lib/server/utils/tba.js';
import { fail } from '@sveltejs/kit';
import type { TBATeam } from 'tatorscout/tba';

export const load = async (event) => {
	const { year, teamNumber } = event.params;
	const scouting = (await Scouting.getTeamPrescouting(Number(teamNumber), Number(year))).unwrap();
	const team = await Team.getTeam(Number(teamNumber)).unwrap();

	const events = await Promise.all(
		scouting.map(async (s) => {
			const event = await Event.getEvent(s.data.eventKey).unwrap();
			const matches = await event.getMatches().unwrap();
			const teams = await event.getTeams().unwrap();
			return {
				event: event.tba,
				matches: matches.map((m) => m.tba),
				teams: teams.map((t) => t.tba)
			};
		})
	);
	return {
		scouting: scouting.map((s) => s.safe()),
		events,
		team
	};
};
