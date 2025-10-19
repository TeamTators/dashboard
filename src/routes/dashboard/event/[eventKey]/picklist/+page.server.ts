// import { Picklist } from '$lib/server/structs/picklist.js';

import { Event } from '$lib/server/utils/tba.js';

export const load = async (event) => {
	// const data = await Picklist.getLists(event.params.eventKey).unwrap();
	const e = await Event.getEvent(event.params.eventKey).unwrap();
	const teams = await e.getTeams().unwrap();

	return {
		event: e.tba,
		teams: teams.map((t) => t.tba),
		// picklists: data.map(d => ({
		//     list: d.list.safe(),
		//     teams: d.teams.map(t => t.safe()),
		//     changes: d.changes.map(c => c.safe()),
		// })),
		eventKey: event.params.eventKey
	};
};
