import { boolean, integer, text } from "drizzle-orm/pg-core";
import { Struct } from "drizzle-struct/back-end";
import { attemptAsync } from "ts-utils/check";
import { DB } from "../db";
import { eq } from "drizzle-orm";

export namespace Picklist {
    export const Picklist = new Struct({
        name: 'picklist',
        structure: {
            eventKey: text('event_key').notNull(),
            name: text('name').notNull(),
            frozen: boolean('frozen').notNull().default(false),
        }
    });

    export type PicklistData = typeof Picklist.sample;


    export const PicklistTeam = new Struct({
        name: 'picklist_team',
        structure: {
            picklist: text('picklist').notNull(),
            team: integer('team').notNull(),
            order: integer('order').notNull(),
            reason: text('reason').notNull(),
            chosen: boolean('chosen').notNull().default(false),
        },
        log: true,
    });

    export type PicklistTeamData = typeof PicklistTeam.sample;

    export const PicklistChange = new Struct({
        name: 'picklist_change',
        structure: {
            picklist: text('picklist').notNull(),
            direction: text('direction').notNull(),
            team: integer('team').notNull(),
            reason: text('reason').notNull(),
        }
    });

    export type PicklistChangeData = typeof PicklistChange.sample;

    export const getLists = (eventKey: string) => {
        return attemptAsync(async () => {
            const lists = await DB.select()
                .from(Picklist.table)
                .where(eq(Picklist.table.eventKey, eventKey));

            const teams = await DB.select()
                .from(PicklistTeam.table)
                .innerJoin(Picklist.table, eq(PicklistTeam.table.picklist, Picklist.table.eventKey))
                .where(eq(Picklist.table.eventKey, eventKey));
            
            const change = await DB.select()
                .from(PicklistChange.table)
                .innerJoin(Picklist.table, eq(PicklistChange.table.picklist, Picklist.table.eventKey))
                .where(eq(Picklist.table.eventKey, eventKey));

            return lists.map(l => ({
                list: Picklist.Generator(l),
                teams: teams.map(t => PicklistTeam.Generator(t.picklist_team)),
                changes: change.map(c => PicklistChange.Generator(c.picklist_change)),
            }))
        });
    };
}


export const _picklist = Picklist.Picklist.table;
export const _picklistTeam = Picklist.PicklistTeam.table;
export const _picklistChange = Picklist.PicklistChange.table;