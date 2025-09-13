import { Strategy } from '$lib/server/structs/strategy.js';
import { Event } from '$lib/server/utils/tba.js';

export const load = async (event) => {
	const e = await Event.getEvent(event.params.eventKey).unwrap();

	const teams = await e.getTeams().unwrap();
	const matches = await e.getMatches().unwrap();

	const strategies = await Strategy.Strategy.fromProperty('eventKey', event.params.eventKey, {
		type: 'stream'
	})
		.await()
		.unwrap();

	return {
		event: e.tba,
		teams: teams.map((t) => t.tba),
		matches: matches.map((m) => m.tba),
		strategies: strategies.map((s) => s.safe())
	};
};
