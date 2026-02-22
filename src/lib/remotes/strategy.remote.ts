import { command, query } from "$app/server";
import { Strategy } from "$lib/server/structs/strategy";
import { error } from "@sveltejs/kit";
import z from "zod";
import { getAccount } from "./index.remote";


export const fromId = query(z.object({
    id: z.string(),
}), async ({ id }) => {
    const strategy = await Strategy.Strategy.fromId(id);
    if (strategy.isErr()) return error(503, "Failed to fetch strategy");

    if (!strategy.value) return error(404, "Strategy not found");

    const partners = await Strategy.getPartners(strategy.value);
    const opponents = await Strategy.getOpponents(strategy.value);

    if (partners.isErr() || opponents.isErr()) return error(503, "Failed to fetch strategy partners/opponents");

    return {
        strategy: strategy.value.safe(),
        partners: partners.value.map(p => p.safe()),
        opponents: opponents.value.map(o => o.safe()),
    }
});

export const fromMatch = query(z.object({
    eventKey: z.string(),
    matchNumber: z.number(),
    compLevel: z.string(),
}), async ({ eventKey, matchNumber, compLevel }) => {
    const strategy = await Strategy.Strategy.get({ eventKey, matchNumber, compLevel }, { type: 'all' });
    if (strategy.isErr()) return error(503, "Failed to fetch strategy");

    return Promise.all(strategy.value.map(async (s) => {
        const partners = await Strategy.getPartners(s);
        const opponents = await Strategy.getOpponents(s);

        if (partners.isErr() || opponents.isErr()) return error(503, "Failed to fetch strategy partners/opponents");

        return {
            strategy: s.safe(),
            partners: partners.value.map(p => p.safe()),
            opponents: opponents.value.map(o => o.safe()),
        }
    }));
});

export const create = command(z.object({
    eventKey: z.string(),
    name: z.string(),
    alliance: z.enum(['red', 'blue']),
    matchNumber: z.number(),
    compLevel: z.string(),
    partners: z.tuple([z.number(), z.number(), z.number()]),
    opponents: z.tuple([z.number(), z.number(), z.number()]),
}), async (config) => {
    const account = await getAccount();
    if (!account) return error(401, "Unauthorized");
    if (!account.data.verified) return error(403, "Email not verified");


    const strategy = await Strategy.createStrategy({
        ...config,
        createdBy: account.data.id,
    });

    if (strategy.isErr()) {
        console.error(strategy.error);
        return error(503, "Failed to create strategy");
    }

    return strategy.value.safe();
});