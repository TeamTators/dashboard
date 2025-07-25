import { Struct } from "drizzle-struct/front-end";
import { browser } from "$app/environment";
import { sse } from "$lib/services/sse";

export namespace Demo {
    export const Demo = new Struct({
        name: 'demo',
        structure: {
            age: 'number',
        },
        browser,
        socket: sse
    });
}