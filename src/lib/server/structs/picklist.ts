import { integer, text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end'; 
import { attemptAsync } from 'ts-utils/check';

export namespace Picklist {
    export const Picklist = new Struct({
        name: 'picklist',
        structure: {
            list: text('list').notNull(),
            team: integer('team').notNull(),
            reason: text('reason').notNull(),
        }
    });

    export const Lists = new Struct({
        name: 'picklist_lists',
        structure: {
            eventKey: text('event_key').notNull(),
            name: text('name').notNull(),
        }
    });

    export const getPicklists = (eventKey: string) => {
        return attemptAsync(async () => {
            const lists = await Lists.fromProperty('eventKey', eventKey, {
                type: 'all',
            }).unwrap();

            return Promise.all(lists.map(async l => {
                const teams = await Picklist.fromProperty('list', l.id, {
                    type: 'all',
                }).unwrap();
                return {
                    teams,
                    list: l,
                }
            }));
        });
    };
}

export const _picklist = Picklist.Picklist.table;
export const _lists = Picklist.Lists.table;