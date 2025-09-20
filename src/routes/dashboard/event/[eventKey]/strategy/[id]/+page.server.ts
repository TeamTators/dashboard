import { Scouting } from '$lib/server/structs/scouting.js';
import { Strategy } from '$lib/server/structs/strategy.js';
import { Event } from '$lib/server/utils/tba.js';
import { fail, redirect } from '@sveltejs/kit';
import { resolveAll } from 'ts-utils/check';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	const strategy = await Strategy.Strategy.fromId(event.params.id).unwrap();
	if (!strategy) {
		throw redirect(
			ServerCode.permanentRedirect,
			`/dashboard/event/${event.params.eventKey}/strategy`
		);
	}

	const info = await Strategy.getStrategy(strategy).unwrap();

	const e = await Event.getEvent(event.params.eventKey).unwrap();
	const teams = await e.getTeams().unwrap();
	const matches = await e.getMatches().unwrap();

	const [p1, p2, p3, o1, o2, o3] = resolveAll(
		await Promise.all([
			Scouting.getTeamScouting(strategy.data.partner1, event.params.eventKey),
			Scouting.getTeamScouting(strategy.data.partner2, event.params.eventKey),
			Scouting.getTeamScouting(strategy.data.partner3, event.params.eventKey),
			Scouting.getTeamScouting(strategy.data.opponent1, event.params.eventKey),
			Scouting.getTeamScouting(strategy.data.opponent2, event.params.eventKey),
			Scouting.getTeamScouting(strategy.data.opponent3, event.params.eventKey)
		])
	).unwrap();

	return {
		strategy: info.strategy.safe(),
		partners: info.partners.map((p) => p.safe()),
		opponents: info.opponents.map((o) => o.safe()),
		event: e.tba,
		teams: teams.map((t) => t.tba),
		matches: matches.map((m) => m.tba),
		scouting: {
			partner1: p1.map((s) => s.safe()),
			partner2: p2.map((s) => s.safe()),
			partner3: p3.map((s) => s.safe()),
			opponent1: o1.map((s) => s.safe()),
			opponent2: o2.map((s) => s.safe()),
			opponent3: o3.map((s) => s.safe())
		}
	};
};
