import type { RequestEvent } from "@sveltejs/kit";
import { str } from "./env";
import { strictEqual } from "node:assert";

export const auth = (event: RequestEvent) => {
    const key = event.request.headers.get('X-API-KEY');
    if (key) {
        strictEqual(key, str('EVENT_SERVER_API_KEY', true));
    } else if (event.locals.account?.data.verified) {
        return;
    } else {
        throw new Error('Invalid API key');
    }
};