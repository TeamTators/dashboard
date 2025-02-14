import { Scouting } from '$lib/server/structs/scouting.js';

export const load = async (event) => {
	return {
		eventKey: event.params.eventKey
	};
};
