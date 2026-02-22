import { error, redirect } from '@sveltejs/kit';
import { Strategy } from '$lib/server/structs/strategy.js';
import { Event } from '$lib/server/utils/tba.js';

export const load = async ({ params, locals }) => {
	if (!locals.account) throw redirect(307, '/account/sign-in');
	if (!locals.account.data.verified) throw error(403, 'Account not verified');

	const event = await Event.getEvent(params.eventKey).unwrap();
	const [teams, matches, strategies] = await Promise.all([
		event.getTeams().unwrap(),
		event.getMatches().unwrap(),
		Strategy.Strategy.get({ eventKey: params.eventKey }, { type: 'all' }).unwrap()
	]);

	return {
		event: event.tba,
		teams: teams.map((t) => t.tba),
		matches: matches.map((m) => m.tba),
		strategies: strategies.map((s) => s.safe())
	};
};
