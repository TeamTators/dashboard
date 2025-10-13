import { Scouting } from '../src/lib/server/structs/scouting';
import { DB } from '../src/lib/server/db';
import { compress, TraceSchema, type TraceArray } from 'tatorscout/trace';

export default async () => {
    await Scouting.MatchScouting.build(DB).unwrap();

    const res = await Scouting.MatchScouting.all({ type: 'all' }).unwrap();
    let size = 0;
    let compressedSize = 0;

    for (const match of res) {
        size += match.data.trace.length;
        const data = TraceSchema.safeParse(JSON.parse(match.data.trace));
        if (!data.success) {
            console.error(`Invalid trace data for match ${match.id}`);
        } else {
            const c = (n: number) => Math.round(n * 1000);
            const expanded = (data.data as TraceArray).map(p => ([
                p[0],
                c(p[1]),
                c(p[2]),
                p[3],
            ]));
            try {
                const res = compress(expanded as TraceArray);
                compressedSize += res.length;
                await match.update({
                    trace: JSON.stringify({
                        state: 'compressed',
                        trace: res,
                    })
                }).unwrap()
            } catch (error) {
                console.error(`Error compressing trace data for match ${match.id}: ${error}`);
                console.log(expanded.filter(p => {
                    const A = Number(p[1]);
                    const B = Number(p[2]);
                    return A < 0 || A > 999 || B < 0 || B > 999;
                }));
            }
        }
    }

    console.log(`Original size: ${size} bytes`);
    console.log(`Compressed size: ${compressedSize} bytes`);
    console.log(`Compressed size is ${(compressedSize / size * 100).toFixed(2)}% of original size`);
};