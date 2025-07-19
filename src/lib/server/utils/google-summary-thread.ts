import { type Table } from './google-summary';
import { attemptAsync } from 'ts-utils/check';
import terminal from './terminal';
import { Team } from './tba';

export const generateSummary = async (
    data: { table: Table; teams: Team[] },
) => {
    return attemptAsync(async () => {
        const { table, teams } = data;
        return await Promise.all(
            teams.map(t => {
                return Promise.all(table.columns.map(async c => {
                    try {
                        const res = await c.fn(t);
                        if (typeof res === 'number') return res.toFixed(2);
                        if (typeof res === 'string' && !isNaN(Number(res))) return Number(res).toFixed(2);
                        return res;
                    } catch (error) {
                        terminal.error(
                            'Error serializing column',
                            JSON.stringify({ column: c.name, error }),
                        )
                        return 'Error';
                    }
                }));
            }),
        )
    });
};