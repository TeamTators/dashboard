import { browser } from "$app/environment";
import { sse } from "$lib/services/sse";
import { Struct } from "$lib/services/struct";

export namespace Cache {
    export const Data = new Struct({
        name: 'data_cache',
        structure: {
            key: 'string',
            scope: 'string',
            data: 'string',
        },
        browser,
        socket: sse,
    });
}