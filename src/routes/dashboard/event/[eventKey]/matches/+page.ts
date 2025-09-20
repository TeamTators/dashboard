import { Scouting } from '$lib/model/scouting.js';

export const load = (event) => {
	return {
		...event.data,
		scouting: event.data.scouting.map((s) => Scouting.MatchScouting.Generator(s))
	};
};
