import { Event } from '$lib/server/utils/tba.js';
import { json } from '@sveltejs/kit';
import { EventSchema } from 'tatorscout/tba';

export const POST = async (event) => {
    if (!event.locals.account) return json({ success: false, message: 'You must be signed in to create an event.' }, { status: 401 });

    const data = await event.request.json();
    const parsed = EventSchema.safeParse(data);
    if (!parsed.success) {
        console.error('Invalid event data:', parsed.error);
        return json({ success: false, message: 'Invalid event data.' }, { status: 400 });
    }

    const res = await Event.createEvent({
        ...parsed.data,
        startDate: new Date(parsed.data.start_date),
        endDate: new Date(parsed.data.end_date)
    });

    if (res.isOk()) {
        return json({ success: true, message: 'Event created successfully.' });
    }
    return json({ success: false, message: res.error.message }, { status: 500 });
};