import { browser } from "$app/environment";
import { sse } from "$lib/services/sse";
import { Struct } from "$lib/services/struct";
import type { Account } from "./account";
import type { TaskTypes } from "$lib/types/tasks";

export namespace Tasks {
    export const Tasks = new Struct({
        name: 'tasks', 
        structure: {
            name: 'string',
            description: 'string',
            type: 'string',
            args: 'string',
            assignedTo: 'string',
            dueDate: 'date',
            eventKey: 'string',
            createdBy: 'string',
            completed: 'boolean',
            completedAt: 'date',
            completedBy: 'string',
        },
        socket: sse,
        browser,
    });

    export const assign = <T extends keyof TaskTypes>(config: {
        name: string;
        description: string;
        account: Account.AccountData;
        type: T;
        args: TaskTypes[T];
        dueDate: Date;
        eventKey: string;
    }) => {
        return Tasks.call('assign', {
            ...config,
            assignedTo: config.account.data.id,
        });
    }
}