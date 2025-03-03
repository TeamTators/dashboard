import { status } from '$lib/server/utils/server-utils.js';
import { Event } from '$lib/server/utils/tba.js';
import terminal from '$lib/server/utils/terminal.js';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
    const year = parseInt(event.params.year);
    if (isNaN(year)) {
        throw status(ServerCode.badRequest);
    }

    const events = await Event.getEvents(year);
    if (events.isErr()) {
        terminal.error('Failed to get events', events.error);
        throw status(ServerCode.internalServerError);
    }

    return { year, events: events.value.map(e => e.tba) };
};