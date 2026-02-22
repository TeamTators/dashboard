import { TBAEvent, TBAMatch } from '$lib/utils/tba.js';
import { Strategy } from '$lib/model/strategy.js';

export const load = async ({ data }) => {
	const event = new TBAEvent(data.event);
	const matches = data.matches.map((m) => new TBAMatch(m, event));
	return {
		event,
		matches,
		strategies: Strategy.Strategy.arr(data.strategies.map((s) => Strategy.Strategy.Generator(s)))
	};
};
