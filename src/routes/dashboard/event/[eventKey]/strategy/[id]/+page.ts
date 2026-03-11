import { Strategy } from '$lib/model/strategy.js';
import { TBAEvent, TBATeam, TBAMatch } from '$lib/utils/tba.js';
import { error } from '@sveltejs/kit';

export const load = async ({ data }) => {
	const event = new TBAEvent(data.event);
	const matches = data.matches.map((m) => new TBAMatch(m, event));
	const match = matches.find(
		(m) =>
			m.tba.comp_level === data.strategy.strategy.compLevel &&
			m.tba.match_number === data.strategy.strategy.matchNumber
	);
	const strategy = Strategy.StrategyExtended.from(
		Strategy.Strategy.Generator(data.strategy.strategy),
		data.strategy.partners.map((p) => Strategy.Partners.Generator(p)) as [
			Strategy.PartnerData,
			Strategy.PartnerData,
			Strategy.PartnerData
		],
		data.strategy.opponents.map((o) => Strategy.Opponents.Generator(o)) as [
			Strategy.OpponentData,
			Strategy.OpponentData,
			Strategy.OpponentData
		],
		match
	);
	if (strategy.isErr()) {
		throw error(500, 'Failed to parse strategy data');
	}
	return {
		event,
		teams: data.teams.map((t) => new TBATeam(t, event)),
		strategy: strategy.value
	};
};
