import { integer } from "drizzle-orm/pg-core";
import { Struct } from "drizzle-struct/back-end";

export namespace Demo {
    export const Demo = new Struct({
        name: 'demo',
        structure: {
            age: integer('age').notNull(),
        }
    });
}

export const _demo = Demo.Demo.table;