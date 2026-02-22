import { Strategy } from '$lib/server/structs/strategy.js';
import { Event } from '$lib/server/utils/tba.js';
import { redirect, error } from '@sveltejs/kit';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(307, '/account/sign-in');

	if (!event.locals.account.data.verified) throw error(403, 'Account not verified');

	const tbaEvent = await Event.getEvent(event.params.eventKey).unwrap();
	const strategy = await Strategy.Strategy.fromId(event.params.id).unwrap();
	if (!strategy) throw error(404, 'Strategy not found');
	const [teams, matches, strategyData] = await Promise.all([
		tbaEvent.getTeams(),
		tbaEvent.getMatches(),
		Strategy.getStrategy(strategy)
	]);
	if (teams.isErr()) throw error(500, 'Failed to fetch teams');
	if (matches.isErr()) throw error(500, 'Failed to fetch matches');
	if (strategyData.isErr()) throw error(500, 'Failed to fetch strategy data');

	return {
		event: tbaEvent.tba,
		teams: teams.value.map((t) => t.tba),
		matches: matches.value.map((m) => m.tba),
		strategy: {
			strategy: strategyData.value.strategy.safe(),
			partners: strategyData.value.partners.map((p) => p.safe()),
			opponents: strategyData.value.opponents.map((o) => o.safe())
		}
	};
};
