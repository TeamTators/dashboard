import { fail, json } from '@sveltejs/kit';
import { Event } from '$lib/server/utils/tba.ts';
import { FIRST } from '$lib/server/structs/FIRST.js';
import { auth } from '$lib/server/utils/auth-api.js';

export const GET = async (e) => {
    auth(e);
    const { eventKey, team } = e.params;

    if (isNaN(parseInt(team))) throw fail(400);

    const event = await Event.getEvent(eventKey).unwrap();
    const teams = await event.getTeams().unwrap();
    if (!teams.find(t => t.tba.team_number === Number(team))) {
        throw fail(400);
    }

    const pictures = await FIRST.TeamPictures.get({
        eventKey,
        team: Number(team),
    }, {
        type: 'all',
    }).unwrap();

    return json(pictures.map(p => p.data.picture));
};