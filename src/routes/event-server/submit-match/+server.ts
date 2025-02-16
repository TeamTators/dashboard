import { Scouting } from '$lib/server/structs/scouting.js';
import { z } from 'zod';

export const POST = async (event) => {
    const header = event.request.headers.get('X-API-KEY');

    if (String(header) !== String(process.env.EVENT_SERVER_API_KEY)) {
        return new Response('Unauthorized', { status: 401 });
    }
    
    const parsed = z
        .object({
            eventKey: z.string(),
            matchNumber: z.number().int(),
            compLevel: z.string(),
            team: z.number().int(),
            scoutId: z.string(),
            scoutGroup: z.number().int(),
            prescouting: z.boolean(),
            remote: z.boolean(),
            trace: z.array(z.tuple([
                z.number(),
                z.number(),
                z.number(),
                z.string(),
            ])),
            checks: z.array(z.string()),
        }).safeParse(await event.request.json());

    if (!parsed.success) {
        return new Response('Invalid data', { status: 400 });
    }

    const { eventKey, matchNumber, compLevel, team, scoutId, scoutGroup, prescouting, remote, trace, checks } = parsed.data;

    const exists = await Scouting.getMatchScouting({
        eventKey,
        match: matchNumber,
        team,
        compLevel,
    });

    if (exists.isErr()) return new Response('Internal server error', { status: 500 });
    if (exists.value) {
        const update = await exists.value.update({
            scoutId,
            scoutGroup,
            prescouting,
            remote,
            trace: JSON.stringify(trace),
            checks: JSON.stringify(checks),
        });
        if (update.isErr()) {
            return new Response('Internal server error', { status: 500 });
        }
    } else {
        const create = await Scouting.MatchScouting.new({
            eventKey,
            matchNumber,
            compLevel,
            team,
            scoutId,
            scoutGroup,
            prescouting,
            remote,
            trace: JSON.stringify(trace),
            checks: JSON.stringify(checks),
        });
        if (create.isErr()) {
            return new Response('Internal server error', { status: 500 });
        }
    }


    return new Response('OK', { status: 200 });
};