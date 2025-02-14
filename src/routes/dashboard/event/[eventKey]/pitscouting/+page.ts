import { Scouting } from '$lib/model/scouting.js';

export const load = (event) => {
	return {
		eventKey: event.data.eventKey
	};
};
