import { boolean, text, timestamp } from "drizzle-orm/pg-core";
import { Struct } from "drizzle-struct/back-end";
import type { Account } from "./account";
import type { TaskTypes } from "$lib/types/tasks";
import { CallListener } from "../services/struct-listeners";
import { z } from "zod";

export namespace Tasks {

    export const Tasks = new Struct({
        name: 'tasks',
        structure: {
            name: text('name').notNull(),
            description: text('description').notNull(),
            type: text('type').notNull(), // group task types by type+args to auto complete
            args: text('args').notNull(), // used to auto complete tasks
            assignedTo: text('assigned_to').notNull(),
            dueDate: timestamp('due_date', {
                withTimezone: true,
            }).notNull(),
            eventKey: text('event_key').notNull(),
            createdBy: text('created_by').notNull(),
            completed: boolean('completed').notNull().default(false),
            // January 1, 1970 00:00:00 GMT if not completed
            completedAt: timestamp('completed_at', {
                withTimezone: true,
            }).default(new Date(0)),
            completedBy: text('completed_by'),
        }
    });

    CallListener.on(
        'assign',
        Tasks,
        z.object({
            name: z.string(),
            description: z.string(),
            account: z.string(),
            type: z.string(),
            args: z.unknown(),
            dueDate: z.string().date(),
            eventKey: z.string(),
        }),
        (event, data) => {
            return {
                success: true,
            }
        }
    )

    export const assign = <T extends keyof TaskTypes>(
        config: {
            name: string;
            description: string;
            account: Account.AccountData;
            type: T;
            args: TaskTypes[T];
            dueDate: Date;
            eventKey: string;
            createdBy: Account.AccountData;
        }
    ) => {
        return Tasks.new({
            ...config,
            args: JSON.stringify(config.args),
            assignedTo: config.account.id,
            createdBy: config.createdBy.id,
            completed: false,
            completedAt: new Date(0),
            completedBy: '',
        });
    };
}

export const _tasksTable = Tasks.Tasks.table;