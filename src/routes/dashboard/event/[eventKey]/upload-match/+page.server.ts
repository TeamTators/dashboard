import { Event } from '$lib/server/utils/tba.js'

export const load = async (event) => {
    const e = await Event.getEvent(event.params.eventKey).unwrap();

    return {
        event: e.tba,
    }
}