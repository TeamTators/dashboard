import { Event } from '$lib/server/utils/tba.js';
import { Picklist } from '$lib/server/structs/picklist';

export const load = async (event) => {
    const e = await Event.getEvent(event.params.eventKey).unwrap();
    const teams = await e.getTeams().unwrap();

    const lists = await Picklist.getPicklists(event.params.eventKey).unwrap();

    return {
        event: e.tba,
        picklist: lists.map(p => ({
            list: p.list.safe(),
            teams: p.teams.map(t => t.safe()),
        })),
        teams: teams.map(t => t.tba),
    }
};