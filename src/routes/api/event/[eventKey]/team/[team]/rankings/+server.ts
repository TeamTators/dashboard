import { fail, json } from '@sveltejs/kit';
import { Event } from '$lib/server/utils/tba.ts';
import { FIRST } from '$lib/server/structs/FIRST.js';
import { auth } from '$lib/server/utils/auth-api.js';

export const GET = async (e) => {
    auth(e);
    const { eventKey, team } = e.params;

    if (isNaN(parseInt(team))) throw fail(400);

    const event = await Event.getEvent(eventKey).unwrap();
    const summary = await FIRST.getSummary(eventKey, event.tba.year as 2024 | 2025).unwrap();

    return json(summary.getRanking(Number(team)));
};