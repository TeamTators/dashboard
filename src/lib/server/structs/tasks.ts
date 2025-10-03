import { boolean, text, timestamp } from "drizzle-orm/pg-core";
import { Struct } from "drizzle-struct/back-end";
import { Account } from "./account";
import type { TaskTypes } from "$lib/types/tasks";
import { CallListener } from "../services/struct-listeners";
import { z } from "zod";
import { attemptAsync } from "ts-utils/check";
import { deepEqual } from "node:assert";
import { DB } from "../db";
import { and, eq } from "drizzle-orm";
import { Scouting } from "./scouting";
import terminal from "../utils/terminal";

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
            }).notNull().default(new Date(0)),
            completedBy: text('completed_by').notNull(),
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
        async (event, data) => {
            if (!event.locals.account) {
                return {
                    success: false,
                    message: 'You must be logged in to perform thi soperation',
                }
            }
            const account = await Account.Account.fromId(data.account).unwrap();
            if (!account) return {
                success: false,
                message: 'Target account not found',
            }
            const res = await assign({
                ...data,
                createdBy: event.locals.account,
                account,
                type: data.type as keyof TaskTypes,
                args: data.args as TaskTypes[keyof TaskTypes],
                dueDate: new Date(data.dueDate),
            });
            if (res.isErr()) {
                return {
                    success: false,
                    message: 'Internal server error',
                }
            }
            return {
                success: true,
            }
        }
    );

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

    export const complete = <T extends keyof TaskTypes>(
        config: {
            eventKey: string;
            type: T;
            args: TaskTypes[T];
            completedBy: Account.AccountData;
        }
    ) => {
        return attemptAsync(async () => {
            const tasks = (await DB.select()
                .from(Tasks.table)
                .where(
                    and(
                        eq(Tasks.table.eventKey, config.eventKey),
                        eq(Tasks.table.type, config.type),
                    )
                )).map(t => Tasks.Generator(t));

            await Promise.all(tasks.map(async t => {
                const data = JSON.parse(t.data.args);
                try {
                    deepEqual(data, config.args);
                } catch {
                    return;
                }
                await t.update({
                    completed: true,
                    completedBy: config.completedBy.data.id,
                    completedAt: new Date(),
                }).unwrap();
            }));
        });
    };

    Scouting.PIT.Answers.on('create', async (answer) => {
        const question = await Scouting.PIT.Questions.fromId(answer.data.questionId);
        if (question.isErr()) return terminal.error(question.error);
        if (!question.value) return terminal.error('Question not found for answer', answer.data.id);
        const eventKey = await Scouting.PIT.getEventKeyFromAnswer(answer);
        if (eventKey.isErr()) return terminal.error(eventKey.error);
        const questions = await Scouting.PIT.getQuestionsFromEvent(eventKey.value);
        if (questions.isErr()) return terminal.error(questions.error);
        const answers = await Scouting.PIT.Answers.fromProperty(
            'session',
            answer.data.session,
            {
                type: 'all',
            }
        );
        if (answers.isErr()) return terminal.error(answers.error);
        const section = await Scouting.PIT.getSectionFromAnswer(answer);
        if (section.isErr()) return terminal.error(section.error);

        const account = await Account.Account.fromId(answer.data.accountId);
        if (account.isErr()) return terminal.error(account.error);
        if (!account.value) return terminal.error('Account not found for answer', answer.data.id);

        if (questions.value.length === answers.value.length) {
            const res = await complete({
                eventKey: eventKey.value,
                type: 'pit-scouting',
                args: {
                    teamNumber: answer.data.team,
                    section: section.value.data.id,
                },
                completedBy: account.value,
            });
            if (res.isErr()) return terminal.error(res.error);
        }

        complete({
            eventKey: eventKey.value,
            type: 'pit-scouting',
            args: {
                teamNumber: answer.data.team,
                questionId: question.value.data.id,
                section: section.value.data.id,
            },
            completedBy: account.value,
        });
    });
}

export const _tasksTable = Tasks.Tasks.table;