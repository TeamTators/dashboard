import { command, query } from "$app/server";
import z from "zod";
import { getAccount } from "./index.remote";
import { Account } from "$lib/server/structs/account";
import { Scouting } from "$lib/server/structs/scouting";
import { error } from "@sveltejs/kit";
import terminal from "$lib/server/utils/terminal";

export const setPracticeArchive = command(z.object({
    eventKey: z.string(),
    archive: z.boolean(),
}), async ({ eventKey, archive }) => {
    const account = await getAccount();
    if (!account)
        return error(401, 'Unauthorized');
    if (!await Account.isAdmin(account).unwrap()) {
        return error(403, 'Forbidden');
    }

    Scouting.MatchScouting.get(
        { eventKey: eventKey },
        {
            type: 'stream'
        }
    ).pipe((d) => {
        if (!['qm', 'qf', 'sf', 'f'].includes(d.data.compLevel)) d.setArchive(archive);
    });

    return {
        success: true
    };
});

export const pitAnswersFromGroup = query(z.object({
    group: z.string(),
}), async ({ group }) => {
    const account = await getAccount();
    if (!account) return error(401, 'Unauthorized');
    if (!await Account.isAdmin(account).unwrap()) {
        return error(403, 'Forbidden');
    }
    const g = (await Scouting.PIT.Groups.fromId(group)).unwrap();
    if (!g) return error(404, 'Group not found');
    return await Scouting.PIT.getAnswersFromGroup(g).unwrap()
        .then(answers => answers.map(a => a.safe()));
});

export const generateEventPitscoutingTemplate = command(z.object({
    eventKey: z.string(),
}), async ({ eventKey }) => {
    const account = await getAccount();
    if (!account)
        return error(401, 'Unauthorized');
    if (!await Account.isAdmin(account).unwrap()) {
        return error(403, 'Forbidden');
    }
    const res = await Scouting.PIT.generateBoilerplate(eventKey, account.id);

    if (res.isOk()) {
        return {
            success: true
        };
    } else {
        terminal.error(res.error);
        return {
            success: false,
            message: 'Failed to generate'
        };
    }
});

export const copyPitScoutingFromEvent = command(z.object({
    from: z.string(),
    to: z.string(),
}), async ({
    from,
    to
}) => {
    const account = await getAccount();
    if (!account) {
        throw error(401, 'Unauthorized');
    }
    if (!await Account.isAdmin(account).unwrap()) {
        throw error(403, 'Forbidden');
    }

    const res = await Scouting.PIT.copyFromEvent(from, to, account.id);
    if (res.isOk()) {
        return {
            success: true
        };
    } else {
        terminal.error(res.error);
        return {
            success: false,
            message: 'Failed to copy'
        };
    }
});