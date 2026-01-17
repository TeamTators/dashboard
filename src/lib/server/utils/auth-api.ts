import { error, type RequestEvent } from "@sveltejs/kit";
import { str } from "./env";

export const auth = (event: RequestEvent) => {
    const key = event.request.headers.get('X-API-KEY');
    const expectedKey = str('EVENT_SERVER_API_KEY', true);

    if (key) {
        if (key !== expectedKey) {
            throw error(401, 'Invalid API key');
        }
        return;
    }

    if (event.locals.account?.data.verified) {
        return;
    }

    throw error(401, 'Invalid API key');
};