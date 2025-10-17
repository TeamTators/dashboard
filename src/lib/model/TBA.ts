import { browser } from "$app/environment";
import { sse } from "$lib/services/sse";
import { Struct } from "$lib/services/struct";

export namespace TBA {
    export const Requests = new Struct({
        name: 'tba_requests',
        structure: {
            url: 'string',
            response: 'string',
        },
        socket: sse,
        browser
    });

    export const Events = new Struct({
        name: 'tba_custom_events',
        structure: {
            year: 'number',
            eventKey: 'string',
            data: 'string',
        },
        socket: sse,
        browser,
    });

    export const Teams = new Struct({
        name: 'tba_custom_teams',
        structure: {
            eventKey: 'string',
            teamKey: 'string',
            data: 'string',
        },
        socket: sse,
        browser,
    });

    export const Matches = new Struct({
        name: 'tba_custom_matches',
        structure: {
            eventKey: 'string',
            matchKey: 'string',
            data: 'string',
        },
        socket: sse,
        browser,
    });
}