import { browser } from "$app/environment";
import { sse } from "$lib/services/sse";
import { DataArr, Struct } from "$lib/services/struct";

export namespace Picklist {
    export const Picklist = new Struct({
        name: 'picklist',
        structure: {
            list: 'string',
            team: 'number',
            reason: 'string',
        },
        socket: sse,
        browser
    });

    export type PicklistData = typeof Picklist.sample;
    export type PicklistDataArr = DataArr<typeof Picklist.data.structure>;

    export const Lists = new Struct({
        name: 'picklist_lists',
        structure: {
            eventKey: 'string',
            name: 'string',
        },
        socket: sse,
        browser,
    });

    export type ListData = typeof Lists.sample;
}