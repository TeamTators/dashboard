import { status } from '$lib/server/utils/server-utils.js';
import { Event } from '$lib/server/utils/tba.js';
import terminal from '$lib/server/utils/terminal.js';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
    const e = await Event.getEvent(event.params.eventKey);
    if (e.isErr()) {
        terminal.error('Failed to get event', e.error);
        throw status(ServerCode.internalServerError);
    }

    return { event: e.value.tba };
};