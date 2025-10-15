import { integer, text, timestamp } from "drizzle-orm/pg-core";
import { Struct } from "drizzle-struct/back-end";
import { attemptAsync } from "ts-utils/check";
import z from "zod";
import { EventSchema, TeamSchema } from "tatorscout/tba";
import { DB } from "../db";
import { and, eq } from "drizzle-orm";

export namespace Cache {
    export const Data = new Struct({
        name: 'data_cache',
        structure: {
            key: text('key').notNull(),
            scope: text('scope').notNull(),
            data: text('data').notNull(),
            size: integer('size').notNull(),
            expires: timestamp('expires', {
                withTimezone: true,
            }).notNull()
        },
    });

    export type Types = {
        'event-summary': {
            event: z.infer<typeof EventSchema>;
            teams: z.infer<typeof TeamSchema>[];
            summaries: {
                labels: string[];
                title: string;
                data: {
                    [key: string | number]: number[];
                }
            }[];
        };
    };

    export const get = <T extends keyof Types>(key: T, scope: string, zod: z.ZodSchema<Types[T]>) => attemptAsync<Types[T] | undefined>(async () => {
        const [res] = await DB.select()
            .from(Data.table)
            .where(and(eq(
                Data.table.key,
                key
            ), eq(
                Data.table.scope,
                scope,
            ))).limit(1);
        if (!res) return undefined;

        const remove = () => {
            return Data.Generator(res).delete().unwrap();
        };
        if (Date.now() > res.expires.getTime()) {
            await remove();
            return undefined;
        }
        const parsed = zod.safeParse(JSON.parse(res.data));
        if (!parsed.success) {
            remove();
            return undefined;
        }
        return parsed.data;
    });

    export const set = <T extends keyof Types>(
        key: T,
        scope: string, 
        data: Types[T],
        expires: Date,
    ) => attemptAsync(async () => {
        const res = await Data.fromProperty('key', key, { type: 'single' }).unwrap();
        if (res) {
            await res.update({
                data: JSON.stringify(data),
            }).unwrap();
        } else {
            await Data.new({
                key,
                scope,
                data: JSON.stringify(data),
                size: new TextEncoder().encode(JSON.stringify(data)).length,
                expires
            });
        }
    });
}


export const _data = Cache.Data.table;